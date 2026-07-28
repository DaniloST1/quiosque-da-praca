-- ============================================================
-- Migração Fase 3 — Estoque, Financeiro, Ficha Técnica
-- Execute no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ESTOQUE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.estoque_itens (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              text NOT NULL,
  categoria         text NOT NULL DEFAULT 'outros', -- 'carnes','padaria','bebidas','molhos','hortifruti','congelados','outros'
  quantidade        numeric(10,3) NOT NULL DEFAULT 0,
  unidade           text NOT NULL DEFAULT 'un', -- 'kg','g','l','ml','un','cx','pct'
  quantidade_minima numeric(10,3) DEFAULT 0,
  validade          date,
  fornecedor        text,
  observacoes       text,
  custo_unitario    numeric(10,2),
  ativo             boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  tipo        text NOT NULL, -- 'entrada' | 'saida' | 'ajuste' | 'auto_venda'
  quantidade  numeric(10,3) NOT NULL,
  motivo      text,
  pedido_id   uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  usuario_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- FICHA TÉCNICA (produto → ingredientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fichas_tecnicas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  uuid UNIQUE REFERENCES public.produtos(id) ON DELETE CASCADE,
  criado_por  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ficha_ingredientes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id         uuid REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
  estoque_item_id  uuid REFERENCES public.estoque_itens(id) ON DELETE RESTRICT,
  quantidade       numeric(10,4) NOT NULL,
  unidade          text NOT NULL DEFAULT 'un'
);

-- ============================================================
-- FINANCEIRO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financeiro_categorias (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome   text NOT NULL,
  tipo   text NOT NULL, -- 'receita' | 'despesa'
  cor    text DEFAULT '#6b7280',
  icone  text DEFAULT 'circle',
  ativa  boolean DEFAULT true
);

-- Categorias padrão
INSERT INTO public.financeiro_categorias (nome, tipo, cor, icone) VALUES
  ('Vendas Balcão',       'receita',  '#22c55e', 'shopping-bag'),
  ('Vendas iFood',        'receita',  '#f97316', 'truck'),
  ('Vendas WhatsApp',     'receita',  '#16a34a', 'message-circle'),
  ('Vendas Delivery',     'receita',  '#3b82f6', 'bike'),
  ('Outras Receitas',     'receita',  '#8b5cf6', 'plus-circle'),
  ('Matéria-Prima',       'despesa',  '#ef4444', 'package'),
  ('Embalagens',          'despesa',  '#f59e0b', 'box'),
  ('Energia Elétrica',    'despesa',  '#eab308', 'zap'),
  ('Gás',                 'despesa',  '#f97316', 'flame'),
  ('Aluguel',             'despesa',  '#6b7280', 'home'),
  ('Folha de Pagamento',  'despesa',  '#8b5cf6', 'users'),
  ('Marketing',           'despesa',  '#06b6d4', 'megaphone'),
  ('Manutenção',          'despesa',  '#78716c', 'wrench'),
  ('Taxas e Impostos',    'despesa',  '#dc2626', 'file-text'),
  ('Outros Custos',       'despesa',  '#9ca3af', 'more-horizontal')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.financeiro_movimentacoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL, -- 'receita' | 'despesa'
  categoria_id uuid REFERENCES public.financeiro_categorias(id) ON DELETE SET NULL,
  descricao    text NOT NULL,
  valor        numeric(10,2) NOT NULL,
  data         date NOT NULL DEFAULT CURRENT_DATE,
  metodo       text, -- 'pix','dinheiro','cartao','ifood','delivery','outros'
  origem       text DEFAULT 'manual', -- 'manual' | 'pedido' | 'importacao'
  pedido_id    uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  observacoes  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ============================================================
-- CAIXA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.caixa_sessoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aberto_por      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fechado_por     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  valor_abertura  numeric(10,2) NOT NULL DEFAULT 0,
  valor_fechamento numeric(10,2),
  status          text DEFAULT 'aberto', -- 'aberto' | 'fechado'
  observacoes     text,
  aberto_em       timestamptz DEFAULT now(),
  fechado_em      timestamptz
);

-- ============================================================
-- FORNECEDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  cnpj       text,
  telefone   text,
  email      text,
  endereco   text,
  contato    text,
  ativo      boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.estoque_itens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_tecnicas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_ingredientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_categorias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_sessoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estoque_admin" ON public.estoque_itens           FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "movs_admin"    ON public.estoque_movimentacoes   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "fichas_admin"  ON public.fichas_tecnicas         FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "ingred_admin"  ON public.ficha_ingredientes      FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "fin_cat_admin" ON public.financeiro_categorias   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "fin_mov_admin" ON public.financeiro_movimentacoes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "caixa_admin"   ON public.caixa_sessoes           FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "forn_admin"    ON public.fornecedores             FOR ALL USING (auth.uid() IS NOT NULL);
