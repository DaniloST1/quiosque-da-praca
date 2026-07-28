-- Correção crítica para exclusão de entidades
-- O trigger fn_save_revision utilizava RETURN NEW que, em um BEFORE DELETE, 
-- é NULL, cancelando a operação de exclusão silenciosamente sem erro.

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
