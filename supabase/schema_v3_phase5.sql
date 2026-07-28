-- ============================================================
-- Migração Fase 5 — Importação CSV e WhatsApp Templates
-- Execute no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- IMPORTAÇÃO BANCÁRIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.importacao_regras (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra    text NOT NULL,     -- ex: 'IFOOD', 'CPFL', 'ASSAI'
  categoria_id uuid REFERENCES public.financeiro_categorias(id),
  tipo       text NOT NULL,     -- 'receita' | 'despesa'
  created_at timestamptz DEFAULT now(),
  UNIQUE (palavra)
);

ALTER TABLE public.importacao_regras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_admin" ON public.importacao_regras FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- WHATSAPP INTEGRAÇÃO
-- ============================================================
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
  evento text UNIQUE NOT NULL, -- 'novo', 'em_preparo', 'aguardando_motoboy', 'saiu_entrega', 'entregue'
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

-- Templates Padrões Iniciais
INSERT INTO public.whatsapp_templates (evento, mensagem) VALUES
('novo', 'Olá! Seu pedido *#{{numero}}* foi recebido com sucesso pelo Quiosque da Praça e logo começaremos a prepará-lo. 😋'),
('em_preparo', 'Seu pedido *#{{numero}}* já está na chapa! 🍔 Daqui a pouco fica pronto.'),
('aguardando_motoboy', 'Tudo pronto! Seu pedido *#{{numero}}* está só aguardando o motoboy retirar para entrega. 🛵💨'),
('saiu_entrega', 'Aí sim! O motoboy acabou de sair com o seu pedido *#{{numero}}*. Prepare a mesa que já está chegando! 🤩'),
('entregue', 'Pedido *#{{numero}}* entregue! Muito obrigado pela preferência e bom apetite. Volte sempre! ❤️')
ON CONFLICT (evento) DO NOTHING;

-- Trigger para WhatsApp
CREATE OR REPLACE FUNCTION public.enviar_whatsapp_status()
RETURNS TRIGGER AS $$
DECLARE
  tel_destino text;
  template text;
  msg_final text;
BEGIN
  -- Apenas para pedidos com telefone de cliente
  IF NEW.cliente_tel IS NOT NULL AND NEW.cliente_tel <> '' THEN
    
    -- Busca o template ativo para o novo status
    SELECT mensagem INTO template 
    FROM public.whatsapp_templates 
    WHERE evento = NEW.status::text AND ativo = true;

    IF FOUND THEN
      -- Substitui a variável {{numero}}
      msg_final := replace(template, '{{numero}}', NEW.numero::text);
      
      -- Extrai apenas os números do telefone (DDI + DDD + Numero)
      tel_destino := regexp_replace(NEW.cliente_tel, '\D', '', 'g');
      
      -- Garante que tem 55 se não tiver
      IF length(tel_destino) <= 11 THEN
        tel_destino := '55' || tel_destino;
      END IF;

      -- Adiciona na fila de mensagens
      INSERT INTO public.whatsapp_mensagens (pedido_id, telefone_destino, mensagem)
      VALUES (NEW.id, tel_destino, msg_final);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_whatsapp_status ON public.pedidos;
CREATE TRIGGER trg_whatsapp_status
AFTER UPDATE OF status ON public.pedidos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.enviar_whatsapp_status();

-- Disparar também na inserção (novo)
DROP TRIGGER IF EXISTS trg_whatsapp_novo ON public.pedidos;
CREATE TRIGGER trg_whatsapp_novo
AFTER INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.enviar_whatsapp_status();
