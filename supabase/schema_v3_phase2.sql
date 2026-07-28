-- Migração v3.2 — Fase 2 (Cardápio, Pedidos Kanban e WhatsApp)

-- 1. Criação de ENUMs
DO $$ BEGIN
    CREATE TYPE pedido_status AS ENUM ('novo', 'em_preparo', 'pronto', 'aguardando_motoboy', 'saiu_entrega', 'entregue', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pedido_tipo AS ENUM ('local', 'delivery', 'retirada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Mesas (Criar antes de Pedidos)
CREATE TABLE IF NOT EXISTS public.mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer UNIQUE NOT NULL,
  nome text,
  status text DEFAULT 'livre', -- 'livre' | 'ocupada' | 'aguardando_conta'
  qr_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial,
  tipo pedido_tipo NOT NULL DEFAULT 'local',
  status pedido_status NOT NULL DEFAULT 'novo',
  mesa_id uuid REFERENCES public.mesas(id) ON DELETE SET NULL,
  
  -- Dados do cliente (delivery)
  cliente_nome text,
  cliente_tel text,
  cliente_cep text,
  cliente_endereco text,
  cliente_numero text,
  cliente_bairro text,
  
  -- Valores
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  taxa_entrega numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  
  -- Pagamento e Obs
  metodo_pagamento text,
  observacoes text,
  
  -- Tracking de Tempos (Métricas)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  preparo_em timestamptz,
  pronto_em timestamptz,
  aguardando_motoboy_em timestamptz,
  saiu_entrega_em timestamptz,
  entregue_em timestamptz,
  cancelado_em timestamptz,
  tempo_preparo_minutos integer,
  tempo_entrega_minutos integer,
  motoboy_id uuid
);

-- 4. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL,
  nome text NOT NULL, -- snapshot do nome
  preco numeric(10,2) NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabelas do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo boolean DEFAULT false,
  provider text DEFAULT 'evolution_api', -- 'evolution_api' | 'zapi' | 'meta_cloud'
  api_key text,
  instance_id text,
  numero_remetente text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text UNIQUE NOT NULL, -- 'novo_pedido', 'em_preparo', 'aguardando_motoboy', 'saiu_entrega', 'entregue'
  mensagem text NOT NULL,
  ativo boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  telefone_destino text NOT NULL,
  mensagem text NOT NULL,
  status text DEFAULT 'pendente', -- 'pendente' | 'enviada' | 'erro'
  erro_detalhe text,
  created_at timestamptz DEFAULT now()
);

-- Índices e RLS
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON public.pedidos (created_at DESC);

ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mesas leitura publica" ON public.mesas FOR SELECT USING (true);
CREATE POLICY "Mesas todas admin" ON public.mesas FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pedidos leitura publica (qr ou app)" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Pedidos insert publico (novo pedido)" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Pedidos admin todas" ON public.pedidos FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pedido_itens leitura publica" ON public.pedido_itens FOR SELECT USING (true);
CREATE POLICY "Pedido_itens insert publico" ON public.pedido_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "Pedido_itens admin todas" ON public.pedido_itens FOR ALL USING (auth.uid() IS NOT NULL);
