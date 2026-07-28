-- Migração v3.2 — Fase 1 (Vitrine Admin, Pódio, Modal Premium e Upsell)

-- 1. Pódio de produtos mais pedidos
CREATE TABLE public.mais_pedidos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  posicao    integer NOT NULL CHECK (posicao BETWEEN 1 AND 3),
  modo       text DEFAULT 'manual', -- 'manual' | 'automatico'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (posicao)
);

-- Habilitar RLS para mais_pedidos
ALTER TABLE public.mais_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone. mais_pedidos"
ON public.mais_pedidos FOR SELECT
USING (true);

-- 2. Melhoria no Produto (Modal Premium)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS descricao_completa text,
  ADD COLUMN IF NOT EXISTS avaliacao_media    numeric(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_avaliacoes   integer DEFAULT 0;

-- 3. Produtos Relacionados (Upsell)
CREATE TABLE public.produtos_relacionados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_base_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  produto_sugerido_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  origem text DEFAULT 'manual', -- 'manual' | 'automatico'
  score_frequencia integer DEFAULT 0, -- para o modo automático
  created_at timestamptz DEFAULT now(),
  UNIQUE (produto_base_id, produto_sugerido_id)
);

-- Habilitar RLS para produtos_relacionados
ALTER TABLE public.produtos_relacionados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone. produtos_relacionados"
ON public.produtos_relacionados FOR SELECT
USING (true);
