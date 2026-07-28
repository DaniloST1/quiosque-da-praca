-- ============================================================
-- Migração Fase 6 — CMS Interno, Lucratividade e Automações da Vitrine
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Expansão da tabela de Produtos (para o Modal Premium e Cardápio)
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS descricao_completa text,
ADD COLUMN IF NOT EXISTS avaliacao_media numeric(3,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_avaliacoes integer DEFAULT 0;

-- 2. Expansão da tabela de Produtos Relacionados (para o score do Upsell Automático)
ALTER TABLE public.produtos_relacionados
ADD COLUMN IF NOT EXISTS score_frequencia integer DEFAULT 0;

-- 3. Expansão da tabela de Mais Pedidos (se não existir, o campo será criado)
-- (A tabela mais_pedidos foi criada em fases anteriores, mas o campo 'modo' pode não existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'mais_pedidos'
    ) THEN
        ALTER TABLE public.mais_pedidos ADD COLUMN IF NOT EXISTS modo text DEFAULT 'manual';
    ELSE
        -- Fallback caso a tabela não exista ainda
        CREATE TABLE public.mais_pedidos (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
          posicao integer NOT NULL CHECK (posicao BETWEEN 1 AND 3),
          modo text DEFAULT 'manual',
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          UNIQUE(posicao)
        );
    END IF;
END $$;


-- 4. Atualização da View de Lucratividade (adicionando a categoria)
DROP VIEW IF EXISTS public.view_lucratividade;

CREATE OR REPLACE VIEW public.view_lucratividade AS
SELECT
  p.id AS produto_id,
  p.nome,
  c.nome AS categoria_nome,
  p.preco AS preco_venda,
  COALESCE(SUM(fi.quantidade * ei.custo_unitario), 0) AS custo_producao,
  (p.preco - COALESCE(SUM(fi.quantidade * ei.custo_unitario), 0)) AS lucro_bruto,
  CASE WHEN p.preco > 0
    THEN ((p.preco - COALESCE(SUM(fi.quantidade * ei.custo_unitario), 0)) / p.preco) * 100
    ELSE 0
  END AS margem_percentual
FROM produtos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN fichas_tecnicas ft ON ft.produto_id = p.id
LEFT JOIN ficha_ingredientes fi ON fi.ficha_id = ft.id
LEFT JOIN estoque_itens ei ON ei.id = fi.estoque_item_id
GROUP BY p.id, p.nome, c.nome, p.preco;
