-- ==========================================
-- PHASE 7: AVALIAÇÕES, GALERIA, PERSONALIZAÇÃO E ADICIONAIS
-- ==========================================

-- 1. AVALIAÇÕES POR PRODUTO E PEDIDO
-- ------------------------------------------

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS avaliado boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.produto_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  nota integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS avaliacao_media numeric(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_avaliacoes integer DEFAULT 0;

-- Atualizar média e total de avaliações do produto automaticamente
CREATE OR REPLACE FUNCTION public.fn_update_produto_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.produtos
    SET avaliacao_media = COALESCE((SELECT ROUND(AVG(nota)::numeric, 1) FROM public.produto_avaliacoes WHERE produto_id = NEW.produto_id), 0),
        total_avaliacoes = (SELECT COUNT(*) FROM public.produto_avaliacoes WHERE produto_id = NEW.produto_id)
    WHERE id = NEW.produto_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.produtos
    SET avaliacao_media = COALESCE((SELECT ROUND(AVG(nota)::numeric, 1) FROM public.produto_avaliacoes WHERE produto_id = OLD.produto_id), 0),
        total_avaliacoes = (SELECT COUNT(*) FROM public.produto_avaliacoes WHERE produto_id = OLD.produto_id)
    WHERE id = OLD.produto_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_produto_avaliacao ON public.produto_avaliacoes;
CREATE TRIGGER trg_update_produto_avaliacao
AFTER INSERT OR UPDATE OR DELETE ON public.produto_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_update_produto_avaliacao();

-- 2. FICHA TÉCNICA E PERSONALIZAÇÃO (REMOÇÕES)
-- ------------------------------------------

-- Garantir que as tabelas base existam (podem já existir dependendo do estado do projeto)
CREATE TABLE IF NOT EXISTS public.estoque_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ficha_tecnica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  quantidade numeric(10,3) NOT NULL
);

-- Adicionar flags de personalização
ALTER TABLE public.ficha_tecnica
ADD COLUMN IF NOT EXISTS removivel boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS destaque boolean DEFAULT false;

-- Tabela para guardar personalizações nos itens do pedido
CREATE TABLE IF NOT EXISTS public.pedido_item_personalizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_item_id uuid REFERENCES public.pedido_itens(id) ON DELETE CASCADE,
  ingrediente_id uuid REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'removido', -- 'removido' ou 'adicionado'
  created_at timestamptz DEFAULT now()
);

-- 3. ADICIONAIS PAGOS
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.produto_adicionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.produto_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_item_personalizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_tecnica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Leitura publica de produto_avaliacoes" ON public.produto_avaliacoes FOR SELECT USING (true);
CREATE POLICY "Leitura publica de pedido_item_personalizacao" ON public.pedido_item_personalizacao FOR SELECT USING (true);
CREATE POLICY "Leitura publica de produto_adicionais" ON public.produto_adicionais FOR SELECT USING (true);
CREATE POLICY "Leitura publica de ficha_tecnica" ON public.ficha_tecnica FOR SELECT USING (true);
CREATE POLICY "Leitura publica de estoque_itens" ON public.estoque_itens FOR SELECT USING (true);

-- Permissão total para roles autenticadas nestas tabelas (temporário/flexível para o projeto atual)
CREATE POLICY "Admin CRUD produto_avaliacoes" ON public.produto_avaliacoes USING (auth.role() = 'authenticated');
CREATE POLICY "Admin CRUD pedido_item_personalizacao" ON public.pedido_item_personalizacao USING (auth.role() = 'authenticated');
CREATE POLICY "Admin CRUD produto_adicionais" ON public.produto_adicionais USING (auth.role() = 'authenticated');
CREATE POLICY "Admin CRUD ficha_tecnica" ON public.ficha_tecnica USING (auth.role() = 'authenticated');
CREATE POLICY "Admin CRUD estoque_itens" ON public.estoque_itens USING (auth.role() = 'authenticated');

-- Permitir CRUD na tabela mais_pedidos
ALTER TABLE public.mais_pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica de mais_pedidos" ON public.mais_pedidos FOR SELECT USING (true);
CREATE POLICY "Admin CRUD mais_pedidos" ON public.mais_pedidos USING (auth.role() = 'authenticated');

-- ==========================================
-- PHASE 8: ORDENAÇÃO DE SEÇÕES E MENU
-- ==========================================

-- Adicionar a coluna de ordem caso não exista
ALTER TABLE public.secoes_site
ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;

-- Atualizar a ordem inicial baseada na estrutura padrão
UPDATE public.secoes_site SET ordem = CASE chave
  WHEN 'hero'          THEN 1
  WHEN 'promocoes'     THEN 2
  WHEN 'mais_pedidos'  THEN 3
  WHEN 'cardapio'      THEN 4
  WHEN 'combos'        THEN 5
  WHEN 'montar_pedido' THEN 6
  WHEN 'galeria'       THEN 7
  WHEN 'contato'       THEN 8
  WHEN 'avaliacoes'    THEN 9
  WHEN 'mapa'          THEN 10
  WHEN 'rodape'        THEN 11
  ELSE 99
END;
