-- 1. Tabela de Visibilidade das Seções do Site
CREATE TABLE IF NOT EXISTS public.secoes_site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  nome text NOT NULL,
  visivel boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.secoes_site ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para secoes_site
CREATE POLICY "public_read_secoes_site" ON public.secoes_site
  FOR SELECT USING (true);

CREATE POLICY "auth_all_secoes_site" ON public.secoes_site
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Popular dados padrão se não existirem
INSERT INTO public.secoes_site (chave, nome, visivel)
VALUES 
  ('hero', 'Hero Banners', true),
  ('promocoes', 'Promoções', true),
  ('mais_pedidos', 'Mais Pedidos', true),
  ('combos', 'Combos Especiais', true),
  ('cardapio', 'Cardápio Completo', true),
  ('galeria', 'Galeria de Fotos', true),
  ('avaliacoes', 'Avaliações de Clientes', true),
  ('contato', 'Contato', true),
  ('mapa', 'Localização / Mapa', true),
  ('rodape', 'Rodapé', true)
ON CONFLICT (chave) DO NOTHING;

-- 2. Alterar Banners para Suporte de Mídia
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS media_tipo text DEFAULT 'imagem';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS media_url_desktop text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS media_url_mobile text;

-- 3. Tabela de Múltiplas Imagens de Produtos
CREATE TABLE IF NOT EXISTS public.produto_imagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  imagem_url text NOT NULL,
  nome_arquivo text,
  favorita boolean DEFAULT false,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.produto_imagens ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para produto_imagens
CREATE POLICY "public_read_produto_imagens" ON public.produto_imagens
  FOR SELECT USING (true);

CREATE POLICY "auth_all_produto_imagens" ON public.produto_imagens
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Função/Trigger para sincronizar a imagem favorita com a coluna 'imagem' de produtos
CREATE OR REPLACE FUNCTION public.fn_sync_produto_imagem_favorita()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a nova imagem for favorita, remover a favorita das outras fotos do mesmo produto
  IF NEW.favorita = true THEN
    UPDATE public.produto_imagens 
    SET favorita = false 
    WHERE produto_id = NEW.produto_id AND id <> NEW.id;

    -- Atualiza a coluna 'imagem' na tabela produtos
    UPDATE public.produtos
    SET imagem = NEW.imagem_url
    WHERE id = NEW.produto_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_produto_imagem_favorita
  AFTER INSERT OR UPDATE OF favorita ON public.produto_imagens
  FOR EACH ROW
  WHEN (NEW.favorita = true)
  EXECUTE FUNCTION public.fn_sync_produto_imagem_favorita();

-- Trigger para exclusão: se a imagem favorita for deletada, limpa a imagem de produtos ou escolhe outra
CREATE OR REPLACE FUNCTION public.fn_sync_produto_imagem_delete()
RETURNS TRIGGER AS $$
DECLARE
  proxima_imagem record;
BEGIN
  IF OLD.favorita = true THEN
    -- Acha outra imagem para ser favorita
    SELECT id, imagem_url FROM public.produto_imagens 
    WHERE produto_id = OLD.produto_id AND id <> OLD.id 
    ORDER BY ordem ASC, created_at DESC 
    LIMIT 1 INTO proxima_imagem;

    IF proxima_imagem.id IS NOT NULL THEN
      UPDATE public.produto_imagens SET favorita = true WHERE id = proxima_imagem.id;
    ELSE
      UPDATE public.produtos SET imagem = NULL WHERE id = OLD.produto_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_produto_imagem_delete
  AFTER DELETE ON public.produto_imagens
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_produto_imagem_delete();
