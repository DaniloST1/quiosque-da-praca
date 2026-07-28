-- ======================================================
-- FASE 8: PORTAL DO CLIENTE (MIGRATION COMPLETA & EXPANDIDA)
-- Arquivo: schema_v6_portal_cliente.sql
-- Aplique este script no SQL Editor do Supabase
-- ======================================================

-- 1. ADAPTAR TABELA DE CLIENTES
ALTER TABLE public.clientes 
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS ultimo_login timestamptz,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS pontos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aceita_marketing boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacoes_whatsapp boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id ON public.clientes(auth_user_id);

-- 2. TABELA DE ENDEREÇOS DO CLIENTE (1:N)
CREATE TABLE IF NOT EXISTS public.cliente_enderecos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  apelido text NOT NULL DEFAULT 'Casa', -- Casa, Trabalho, Outro
  cep text NOT NULL,
  logradouro text NOT NULL,
  numero text NOT NULL,
  complemento text,
  bairro text NOT NULL,
  cidade text NOT NULL,
  estado text DEFAULT 'SP',
  principal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_enderecos_cliente_id ON public.cliente_enderecos(cliente_id);

-- Trigger para garantir ÚNICO endereço principal por cliente
CREATE OR REPLACE FUNCTION public.fn_ensure_single_principal_address()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Se for o primeiro endereço do cliente, força principal = true
  IF (SELECT COUNT(*) FROM public.cliente_enderecos WHERE cliente_id = NEW.cliente_id AND id <> NEW.id) = 0 THEN
    NEW.principal := true;
  END IF;

  -- Se este endereço estiver sendo marcado como principal, desmarca os outros do mesmo cliente
  IF NEW.principal = true THEN
    UPDATE public.cliente_enderecos
       SET principal = false
     WHERE cliente_id = NEW.cliente_id
       AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_principal_address ON public.cliente_enderecos;
CREATE TRIGGER trg_ensure_single_principal_address
  BEFORE INSERT OR UPDATE OF principal ON public.cliente_enderecos
  FOR EACH ROW EXECUTE FUNCTION public.fn_ensure_single_principal_address();

-- 3. TABELA DE FAVORITOS
CREATE TABLE IF NOT EXISTS public.cliente_favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_favoritos_cliente ON public.cliente_favoritos(cliente_id);

-- 4. PREPARATIVOS DE CUPONS E FIDELIDADE
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  descricao text,
  desconto_porcentagem numeric(5,2) DEFAULT 0,
  desconto_valor numeric(10,2) DEFAULT 0,
  valor_minimo_pedido numeric(10,2) DEFAULT 0,
  validade timestamptz,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cliente_cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  cupom_id uuid REFERENCES public.cupons(id) ON DELETE CASCADE,
  usado boolean DEFAULT false,
  usado_em timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. AJUSTAR TABELA DE PEDIDOS E AVALIAÇÕES
ALTER TABLE public.pedidos 
  ADD COLUMN IF NOT EXISTS endereco_id uuid REFERENCES public.cliente_enderecos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cupom_id uuid REFERENCES public.cupons(id) ON DELETE SET NULL;

ALTER TABLE public.produto_avaliacoes
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

-- 6. TRIGGER AUTOMÁTICO DE CRIAÇÃO/VÍNCULO DE AUTH.USERS COM CLIENTES
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cliente_id uuid;
  v_tel text;
  v_tel_norm text;
BEGIN
  v_tel := COALESCE(NEW.raw_user_meta_data->>'telefone', '');
  v_tel_norm := regexp_replace(v_tel, '\D', '', 'g');

  IF v_tel_norm <> '' THEN
    SELECT id INTO v_cliente_id FROM public.clientes WHERE telefone_normalizado = v_tel_norm;
  END IF;

  IF v_cliente_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO v_cliente_id FROM public.clientes WHERE email = NEW.email;
  END IF;

  IF v_cliente_id IS NOT NULL THEN
    UPDATE public.clientes
    SET auth_user_id = NEW.id,
        email = COALESCE(email, NEW.email),
        nome = COALESCE(NULLIF(nome, 'Cliente'), NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        foto_url = COALESCE(foto_url, NEW.raw_user_meta_data->>'avatar_url'),
        ultimo_login = now()
    WHERE id = v_cliente_id;
  ELSE
    INSERT INTO public.clientes (
      auth_user_id,
      nome,
      email,
      telefone,
      telefone_normalizado,
      foto_url,
      ultimo_login
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
      NEW.email,
      v_tel,
      v_tel_norm,
      NEW.raw_user_meta_data->>'avatar_url',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- 7. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.cliente_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_favoritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clientes gerenciam seus enderecos" ON public.cliente_enderecos;
CREATE POLICY "Clientes gerenciam seus enderecos" ON public.cliente_enderecos
  FOR ALL USING (cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Clientes gerenciam seus favoritos" ON public.cliente_favoritos;
CREATE POLICY "Clientes gerenciam seus favoritos" ON public.cliente_favoritos
  FOR ALL USING (cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role tudo" ON public.cliente_enderecos;
CREATE POLICY "Service role tudo" ON public.cliente_enderecos FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role tudo favoritos" ON public.cliente_favoritos;
CREATE POLICY "Service role tudo favoritos" ON public.cliente_favoritos FOR ALL USING (auth.role() = 'service_role');
