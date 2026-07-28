-- Adicionar coluna para galeria de imagens
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS galeria text[] DEFAULT '{}'::text[];
