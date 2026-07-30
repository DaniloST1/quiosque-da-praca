-- ==========================================
-- SCHEMA V7: AVALIAÇÕES LIGADAS A CLIENTES
-- ==========================================

-- Adicionar colunas na tabela avaliacoes para vincular a clientes e produtos
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS produto_nome text,
  ADD COLUMN IF NOT EXISTS destaque_site boolean DEFAULT false;

-- Criar índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente_id ON public.avaliacoes(cliente_id);

-- Criar índice para destaque_site
CREATE INDEX IF NOT EXISTS idx_avaliacoes_destaque_site ON public.avaliacoes(destaque_site) WHERE destaque_site = true;
