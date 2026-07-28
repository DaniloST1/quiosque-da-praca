-- ==========================================
-- FASE 5: SISTEMA DE CLIENTES E CRM
-- ==========================================
-- Arquivo: schema_v5_clientes.sql
-- Aplique este script no SQL Editor do Supabase
-- ==========================================

-- 1. TABELA DE CLIENTES
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 text NOT NULL,
  email                text,
  telefone             text,
  telefone_normalizado text NOT NULL,
  endereco             jsonb DEFAULT '{}',
  -- ex: { "cep": "01001-000", "logradouro": "Rua X", "numero": "10",
  --       "complemento": "Ap 2", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP" }
  aceita_whatsapp      boolean DEFAULT true,
  observacoes          text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Índice único em telefone_normalizado (apenas dígitos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_telefone_normalizado
  ON public.clientes (telefone_normalizado);

-- Índice secundário por email
CREATE INDEX IF NOT EXISTS idx_clientes_email
  ON public.clientes (email);


-- 2. TRIGGER UPDATED_AT AUTOMÁTICO
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


-- 3. VINCULAR PEDIDOS AO CLIENTE
-- ------------------------------------------
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id
  ON public.pedidos (cliente_id);


-- 4. RLS: SOMENTE SERVICE_ROLE ESCREVE, ANON LÊ NADA
-- ------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode SELECT (dashboard admin)
CREATE POLICY "clientes_service_all" ON public.clientes
  FOR ALL USING (auth.role() = 'service_role');


-- 5. MIGRAÇÃO: VINCULAR PEDIDOS ANTIGOS A CLIENTES
-- ------------------------------------------
-- Execute este bloco separadamente depois que a tabela clientes existir.
-- Ele percorre pedidos com telefone, cria clientes a partir deles
-- e vincula o cliente_id ao pedido histórico.

DO $$
DECLARE
  rec RECORD;
  v_tel_norm text;
  v_cliente_id uuid;
BEGIN
  FOR rec IN
    SELECT id, cliente_nome, cliente_tel,
           cliente_cep, cliente_endereco, cliente_numero, cliente_bairro
    FROM public.pedidos
    WHERE cliente_id IS NULL AND cliente_tel IS NOT NULL
  LOOP
    -- Normalizar: manter apenas dígitos
    v_tel_norm := regexp_replace(rec.cliente_tel, '\D', '', 'g');

    CONTINUE WHEN v_tel_norm = '' OR length(v_tel_norm) < 8;

    -- Busca cliente existente
    SELECT id INTO v_cliente_id
      FROM public.clientes
     WHERE telefone_normalizado = v_tel_norm;

    -- Se não existir, cria
    IF v_cliente_id IS NULL THEN
      INSERT INTO public.clientes (nome, telefone, telefone_normalizado, endereco)
      VALUES (
        COALESCE(rec.cliente_nome, 'Cliente'),
        rec.cliente_tel,
        v_tel_norm,
        jsonb_build_object(
          'cep',        rec.cliente_cep,
          'logradouro', rec.cliente_endereco,
          'numero',     rec.cliente_numero,
          'bairro',     rec.cliente_bairro
        )
      )
      RETURNING id INTO v_cliente_id;
    END IF;

    -- Vincula o pedido histórico
    UPDATE public.pedidos SET cliente_id = v_cliente_id WHERE id = rec.id;
  END LOOP;
END;
$$;
