-- ============================================================
-- Quiosque da Praça — Supabase Schema v2.1
-- Execute this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- ============================================================
-- USUARIOS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        text,
  email       text UNIQUE NOT NULL,
  role        user_role NOT NULL DEFAULT 'editor',
  ativo       boolean DEFAULT true,
  avatar_url  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    -- Make the first user ever created a super_admin, otherwise editor
    CASE WHEN (SELECT COUNT(*) FROM public.usuarios) = 0 THEN 'super_admin'::user_role ELSE 'editor'::user_role END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CONFIGURACOES (site-wide settings, one row)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Business info
  nome_empresa          text DEFAULT 'Quiosque da Praça',
  schema_type           text DEFAULT 'Lanchonete',
  cidade                text DEFAULT 'Campinas - SP',
  endereco              text DEFAULT 'R. Jose Pereira Dos Santos, 275 - Jardim do Lago Continuacao',
  cep                   text DEFAULT '13051-058',
  whatsapp_number       text DEFAULT '5519991737183',
  ifood_url             text,
  instagram_handle      text DEFAULT '@quiosquedapraca_25',
  -- Hours
  horarios              jsonb DEFAULT '[
    {"dias": ["quarta","quinta"], "abertura": "19:00", "fechamento": "23:00"},
    {"dias": ["sexta","sabado","domingo"], "abertura": "19:00", "fechamento": "00:00"}
  ]'::jsonb,
  -- Analytics
  ga_id                 text,
  gtm_id                text,
  meta_pixel_id         text,
  -- Maps
  google_maps_embed_url text,
  -- Logos (Supabase Storage URLs)
  logo_principal        text,
  logo_escuro           text,
  logo_claro            text,
  logo_favicon          text,
  -- Social
  facebook_url          text,
  tiktok_url            text,
  -- Theme fallback colors (overridden by temas table)
  cor_primaria          text DEFAULT '#D97A1E',
  cor_secundaria        text DEFAULT '#8B4A1D',
  cor_destaque          text DEFAULT '#F4B400',
  cor_fundo             text DEFAULT '#FFF8EE',
  cor_texto             text DEFAULT '#2B2B2B',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Insert default config row
INSERT INTO public.configuracoes (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================================
-- TEMAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.temas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL DEFAULT 'Padrão',
  cor_primaria    text DEFAULT '#D97A1E',
  cor_secundaria  text DEFAULT '#8B4A1D',
  cor_destaque    text DEFAULT '#F4B400',
  cor_fundo       text DEFAULT '#FFF8EE',
  cor_texto       text DEFAULT '#2B2B2B',
  fonte_titulo    text DEFAULT 'Outfit',
  fonte_corpo     text DEFAULT 'Inter',
  ativo           boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

INSERT INTO public.temas (nome, ativo) VALUES ('Padrão', true);

-- ============================================================
-- SEO (global)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina           text UNIQUE NOT NULL DEFAULT 'home',
  meta_title       text,
  meta_description text,
  og_title         text,
  og_description   text,
  og_image         text,
  schema_json      jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

INSERT INTO public.seo (pagina, meta_title, meta_description)
VALUES ('home',
  'Quiosque da Praça | Lanches, Porções, Pastéis e Espetinhos em Campinas',
  'O melhor lanche de Campinas! Hambúrgueres artesanais, pastéis, porções e espetinhos. Peça pelo WhatsApp ou iFood.')
ON CONFLICT (pagina) DO NOTHING;

-- ============================================================
-- PAGINAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.paginas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  titulo           text,
  conteudo         jsonb,
  seo_title        text,
  seo_description  text,
  seo_og_image     text,
  publicada        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ============================================================
-- BANNERS (Hero)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo                    text NOT NULL,
  subtitulo                 text,
  descricao                 text,
  imagem                    text,
  botao_principal_texto     text DEFAULT 'Ver Cardápio',
  botao_principal_link      text DEFAULT '#cardapio',
  botao_secundario_texto    text DEFAULT 'Pedir no WhatsApp',
  botao_secundario_link     text,
  botao_terciario_texto     text DEFAULT 'Pedir pelo iFood',
  botao_terciario_link      text,
  alinhamento_texto         text DEFAULT 'center',
  ativo                     boolean DEFAULT true,
  ordem                     integer DEFAULT 0,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

INSERT INTO public.banners (titulo, subtitulo, descricao, ordem)
VALUES (
  'Quiosque da Praça',
  'O sabor que reúne amigos e família.',
  'Lanches, porções, espetinhos e pastéis preparados com qualidade e muito sabor em Campinas.',
  0
);

-- ============================================================
-- CATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  emoji       text,
  slug        text UNIQUE NOT NULL,
  descricao   text,
  ordem       integer DEFAULT 0,
  ativa       boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

INSERT INTO public.categorias (nome, emoji, slug, ordem) VALUES
  ('Lanches',     '🍔', 'lanches',     1),
  ('Porções',     '🍟', 'porcoes',     2),
  ('Pastéis',     '🥟', 'pasteis',     3),
  ('Espetinhos',  '🍢', 'espetinhos',  4),
  ('Kids',        '🧒', 'kids',        5),
  ('Bebidas',     '🥤', 'bebidas',     6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.produtos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id     uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  nome             text NOT NULL,
  descricao        text,
  preco            numeric(10,2) NOT NULL DEFAULT 0,
  imagem           text,
  subcategoria     text,   -- e.g. 'refrigerante','suco','cerveja' for Bebidas
  -- Feature flags
  featured         boolean DEFAULT false,
  best_seller      boolean DEFAULT false,
  promotion        boolean DEFAULT false,
  recommended      boolean DEFAULT false,
  ativo            boolean DEFAULT true,
  ordem            integer DEFAULT 0,
  -- Individual SEO
  seo_title        text,
  seo_description  text,
  seo_og_image     text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Seed products
DO $$
DECLARE
  cat_lanches     uuid;
  cat_porcoes     uuid;
  cat_pasteis     uuid;
  cat_espetinhos  uuid;
  cat_kids        uuid;
BEGIN
  SELECT id INTO cat_lanches    FROM public.categorias WHERE slug = 'lanches';
  SELECT id INTO cat_porcoes    FROM public.categorias WHERE slug = 'porcoes';
  SELECT id INTO cat_pasteis    FROM public.categorias WHERE slug = 'pasteis';
  SELECT id INTO cat_espetinhos FROM public.categorias WHERE slug = 'espetinhos';
  SELECT id INTO cat_kids       FROM public.categorias WHERE slug = 'kids';

  INSERT INTO public.produtos (categoria_id, nome, preco, best_seller, ordem) VALUES
    -- Lanches
    (cat_lanches, 'X-Salada',   26.00, false, 1),
    (cat_lanches, 'X-Bacon',    32.00, false, 2),
    (cat_lanches, 'X-Egg',      30.00, false, 3),
    (cat_lanches, 'X-Tudo',     36.00, true,  4),
    (cat_lanches, 'Boquinha de Anjo', 22.00, false, 5),
    -- Porções
    (cat_porcoes, 'Batata Frita',                  18.00, false, 1),
    (cat_porcoes, 'Batata Cheddar e Bacon',         32.00, true,  2),
    (cat_porcoes, 'Calabresa Acebolada',            32.00, false, 3),
    (cat_porcoes, 'Calabresa Acebolada + Fritas',   36.00, false, 4),
    (cat_porcoes, 'Frango a Passarinho + Fritas',   36.00, false, 5),
    -- Pastéis
    (cat_pasteis, 'Pastel de Carne',               10.00, false, 1),
    (cat_pasteis, 'Pastel de Carne com Queijo',    10.00, true,  2),
    (cat_pasteis, 'Pastel de Queijo',              10.00, false, 3),
    (cat_pasteis, 'Pastel de Frango com Catupiry', 10.00, false, 4),
    (cat_pasteis, 'Pastel de Calabresa com Queijo',10.00, false, 5),
    (cat_pasteis, 'Pastel de Pizza',               10.00, false, 6),
    -- Espetinhos
    (cat_espetinhos, 'Carne',          6.00, false, 1),
    (cat_espetinhos, 'Frango',         6.00, false, 2),
    (cat_espetinhos, 'Linguiça',       6.00, false, 3),
    (cat_espetinhos, 'Coração',        6.00, false, 4),
    (cat_espetinhos, 'Kafta',          6.00, false, 5),
    (cat_espetinhos, 'Queijo Coalho',  8.00, false, 6),
    -- Kids
    (cat_kids, 'Combo Kids', 22.00, false, 1);
END $$;

-- ============================================================
-- COMBOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.combos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  descricao   text,
  preco       numeric(10,2) NOT NULL DEFAULT 0,
  imagem      text,
  ativo       boolean DEFAULT true,
  ordem       integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

INSERT INTO public.combos (nome, descricao, preco, ordem) VALUES
  ('Combo Casal',   'X-Tudo + Batata Cheddar para dois', 62.00, 1),
  ('Combo Família', '2 X-Tudo + 2 Batatas + 6 Espetinhos', 98.00, 2),
  ('Combo Kids',    'Hambúrguer Kids + Batata Frita + Suco', 22.00, 3);

-- ============================================================
-- PROMOCOES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promocoes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           text NOT NULL,
  descricao        text,
  imagem           text,
  validade         date,
  dia_semana       text,  -- 'quarta', 'sexta', etc.
  desconto_pct     integer,
  preco_original   numeric(10,2),
  preco_desconto   numeric(10,2),
  ativa            boolean DEFAULT true,
  ordem            integer DEFAULT 0,
  -- Individual SEO
  seo_title        text,
  seo_description  text,
  seo_og_image     text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

INSERT INTO public.promocoes (titulo, descricao, dia_semana, ordem) VALUES
  ('Quarta do Pastel',      'Pastel por apenas R$10! Todo o cardápio disponível.', 'quarta', 1),
  ('Sexta da Batata Cheddar', 'Batata Cheddar e Bacon com desconto especial!', 'sexta', 2),
  ('Combo Família',         'Combo completo para a família toda se deliciar!', null, 3);

-- ============================================================
-- AVALIACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  texto       text NOT NULL,
  nota        integer DEFAULT 5 CHECK (nota BETWEEN 1 AND 5),
  avatar_url  text,
  publicada   boolean DEFAULT true,
  ordem       integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

INSERT INTO public.avaliacoes (nome, texto, nota, ordem) VALUES
  ('Maria S.',   'Melhor hambúrguer de Campinas! O X-Tudo é incrível. Sempre que posso venho aqui.',      5, 1),
  ('João P.',    'Pastel delicioso e espetinhos perfeitos. Atendimento nota 10, super recomendo!',        5, 2),
  ('Ana R.',     'Ambiente agradável, preço justo e comida gostosa. Virei cliente fiel!',                  5, 3),
  ('Carlos M.',  'Pedi pelo iFood e chegou quentinho. Batata Cheddar é viciante, ameei!',                 5, 4),
  ('Fernanda L.','O Combo Família é perfeito para reunir a galera. Vai continuar sendo nossa escolha!',   5, 5);

-- ============================================================
-- GALERIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.galeria (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url          text NOT NULL,
  titulo       text,
  categoria    text DEFAULT 'geral',  -- 'lanches','porcoes','pasteis','espetinhos','ambiente'
  bucket_path  text,
  ativo        boolean DEFAULT true,
  ordem        integer DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ============================================================
-- ACTIVITY_LOGS (Auditoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text,
  user_role    text,
  action       audit_action NOT NULL,
  entity       text NOT NULL,
  entity_id    uuid,
  entity_nome  text,
  diff         jsonb,
  ip_address   text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity  ON public.activity_logs (entity, entity_id);

-- ============================================================
-- REVISOES (Revision snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.revisoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity      text NOT NULL,
  entity_id   uuid NOT NULL,
  version     integer NOT NULL,
  snapshot    jsonb NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revisoes_entity ON public.revisoes (entity, entity_id, version DESC);

-- Trigger: auto-snapshot before UPDATE/DELETE on key tables
CREATE OR REPLACE FUNCTION public.fn_save_revision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  next_version integer;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM public.revisoes
   WHERE entity = TG_TABLE_NAME AND entity_id = OLD.id;

  INSERT INTO public.revisoes (entity, entity_id, version, snapshot)
  VALUES (TG_TABLE_NAME, OLD.id, next_version, to_jsonb(OLD));

  -- Prune: keep only latest 20 revisions
  DELETE FROM public.revisoes
   WHERE entity = TG_TABLE_NAME AND entity_id = OLD.id
     AND version <= next_version - 20;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_produtos_revision
  BEFORE UPDATE OR DELETE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.fn_save_revision();

CREATE OR REPLACE TRIGGER trg_banners_revision
  BEFORE UPDATE OR DELETE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.fn_save_revision();

CREATE OR REPLACE TRIGGER trg_promocoes_revision
  BEFORE UPDATE OR DELETE ON public.promocoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_save_revision();

CREATE OR REPLACE TRIGGER trg_paginas_revision
  BEFORE UPDATE OR DELETE ON public.paginas
  FOR EACH ROW EXECUTE FUNCTION public.fn_save_revision();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER trg_usuarios_updated_at    BEFORE UPDATE ON public.usuarios    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_configuracoes_updated  BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_temas_updated          BEFORE UPDATE ON public.temas        FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_banners_updated        BEFORE UPDATE ON public.banners      FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_categorias_updated     BEFORE UPDATE ON public.categorias   FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_produtos_updated       BEFORE UPDATE ON public.produtos     FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_combos_updated         BEFORE UPDATE ON public.combos       FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_promocoes_updated      BEFORE UPDATE ON public.promocoes    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_avaliacoes_updated     BEFORE UPDATE ON public.avaliacoes   FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_galeria_updated        BEFORE UPDATE ON public.galeria      FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_seo_updated            BEFORE UPDATE ON public.seo          FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_paginas_updated        BEFORE UPDATE ON public.paginas      FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paginas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promocoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisoes        ENABLE ROW LEVEL SECURITY;

-- Public read policies (site visitors)
CREATE POLICY "public_read_banners"      ON public.banners      FOR SELECT USING (ativo = true);
CREATE POLICY "public_read_categorias"   ON public.categorias   FOR SELECT USING (ativa = true);
CREATE POLICY "public_read_produtos"     ON public.produtos     FOR SELECT USING (ativo = true);
CREATE POLICY "public_read_combos"       ON public.combos       FOR SELECT USING (ativo = true);
CREATE POLICY "public_read_promocoes"    ON public.promocoes    FOR SELECT USING (ativa = true);
CREATE POLICY "public_read_avaliacoes"   ON public.avaliacoes   FOR SELECT USING (publicada = true);
CREATE POLICY "public_read_galeria"      ON public.galeria      FOR SELECT USING (ativo = true);
CREATE POLICY "public_read_configuracoes" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "public_read_temas"        ON public.temas        FOR SELECT USING (ativo = true);
CREATE POLICY "public_read_seo"          ON public.seo          FOR SELECT USING (true);
CREATE POLICY "public_read_paginas"      ON public.paginas      FOR SELECT USING (publicada = true);

-- Admin write policies (authenticated users only — enforced further by app-level role check)
CREATE POLICY "auth_all_banners"     ON public.banners     FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_categorias"  ON public.categorias  FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_produtos"    ON public.produtos     FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_combos"      ON public.combos       FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_promocoes"   ON public.promocoes    FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_avaliacoes"  ON public.avaliacoes   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_galeria"     ON public.galeria      FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_config"      ON public.configuracoes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_temas"       ON public.temas        FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_seo"         ON public.seo          FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_paginas"     ON public.paginas      FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_usuarios"    ON public.usuarios     FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_logs"       ON public.activity_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_logs"     ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_revisoes"   ON public.revisoes     FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE BUCKETS
-- Run in SQL editor or via dashboard
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('products',  'products',  true),
  ('gallery',   'gallery',   true),
  ('banners',   'banners',   true),
  ('uploads',   'uploads',   true),
  ('logos',     'logos',     true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read
CREATE POLICY "public_read_products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "public_read_gallery"  ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "public_read_banners"  ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "public_read_uploads"  ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "public_read_logos"    ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- Storage RLS: authenticated upload/delete
CREATE POLICY "auth_write_storage" ON storage.objects
  FOR ALL USING (auth.uid() IS NOT NULL);
