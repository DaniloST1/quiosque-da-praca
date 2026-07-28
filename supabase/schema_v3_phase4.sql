-- ============================================================
-- Migração Fase 4 — Baixa de Estoque, Compras, Lucratividade
-- Execute no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compras (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id   uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  data            date NOT NULL DEFAULT CURRENT_DATE,
  total           numeric(10,2) NOT NULL DEFAULT 0,
  status          text DEFAULT 'concluida', -- 'pendente' | 'concluida' | 'cancelada'
  observacoes     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compra_itens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id       uuid REFERENCES public.compras(id) ON DELETE CASCADE,
  estoque_item_id uuid REFERENCES public.estoque_itens(id) ON DELETE SET NULL,
  nome            text NOT NULL,
  quantidade      numeric(10,3) NOT NULL,
  custo_unitario  numeric(10,2) NOT NULL,
  subtotal        numeric(10,2) GENERATED ALWAYS AS (quantidade * custo_unitario) STORED,
  created_at      timestamptz DEFAULT now()
);

-- RLS Compras
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compra_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compras_admin" ON public.compras FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "compra_itens_admin" ON public.compra_itens FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- BAIXA AUTOMÁTICA DE ESTOQUE (TRIGGER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.baixar_estoque_pedido()
RETURNS TRIGGER AS $$
DECLARE
  ficha_row RECORD;
  quantidade_necessaria numeric;
BEGIN
  -- Percorre todos os ingredientes na ficha técnica do produto vendido
  FOR ficha_row IN
    SELECT 
      fi.estoque_item_id, 
      fi.quantidade 
    FROM public.fichas_tecnicas ft
    JOIN public.ficha_ingredientes fi ON fi.ficha_id = ft.id
    WHERE ft.produto_id = NEW.produto_id
  LOOP
    -- Calcula quantidade total necessária (quantidade do ingrediente * quantidade do produto no pedido)
    quantidade_necessaria := ficha_row.quantidade * NEW.quantidade;

    -- Cria o registro de movimentação de saída
    INSERT INTO public.estoque_movimentacoes (
      item_id, 
      tipo, 
      quantidade, 
      motivo, 
      pedido_id
    ) VALUES (
      ficha_row.estoque_item_id, 
      'auto_venda', 
      quantidade_necessaria, 
      'Venda automática (Pedido)', 
      NEW.pedido_id
    );

    -- Atualiza a quantidade do item no estoque (subtrai)
    UPDATE public.estoque_itens
    SET 
      quantidade = quantidade - quantidade_necessaria,
      updated_at = now()
    WHERE id = ficha_row.estoque_item_id;

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria o trigger na tabela pedido_itens
DROP TRIGGER IF EXISTS trg_baixar_estoque_pedido ON public.pedido_itens;
CREATE TRIGGER trg_baixar_estoque_pedido
AFTER INSERT ON public.pedido_itens
FOR EACH ROW
EXECUTE FUNCTION public.baixar_estoque_pedido();

-- ============================================================
-- ATUALIZAR ESTOQUE APÓS COMPRA (TRIGGER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.atualizar_estoque_compra()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a compra for concluída (ou ao inserir um item numa compra já concluída)
  IF EXISTS (SELECT 1 FROM public.compras WHERE id = NEW.compra_id AND status = 'concluida') THEN
    
    -- Cria o registro de entrada
    INSERT INTO public.estoque_movimentacoes (
      item_id, 
      tipo, 
      quantidade, 
      motivo
    ) VALUES (
      NEW.estoque_item_id, 
      'entrada', 
      NEW.quantidade, 
      'Entrada por Compra'
    );

    -- Atualiza a quantidade e o custo unitário no estoque
    UPDATE public.estoque_itens
    SET 
      quantidade = quantidade + NEW.quantidade,
      custo_unitario = NEW.custo_unitario, -- Atualiza com o último custo pago
      updated_at = now()
    WHERE id = NEW.estoque_item_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_atualizar_estoque_compra ON public.compra_itens;
CREATE TRIGGER trg_atualizar_estoque_compra
AFTER INSERT ON public.compra_itens
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_estoque_compra();

-- ============================================================
-- VIEW DE LUCRATIVIDADE E MARGEM
-- ============================================================

CREATE OR REPLACE VIEW public.view_lucratividade AS
SELECT 
  p.id AS produto_id,
  p.nome,
  p.preco AS preco_venda,
  COALESCE(SUM(fi.quantidade * ei.custo_unitario), 0) AS custo_producao,
  (p.preco - COALESCE(SUM(fi.quantidade * ei.custo_unitario), 0)) AS lucro_bruto,
  CASE 
    WHEN p.preco > 0 
    THEN ((p.preco - COALESCE(SUM(fi.quantidade * ei.custo_unitario), 0)) / p.preco) * 100 
    ELSE 0 
  END AS margem_percentual
FROM public.produtos p
LEFT JOIN public.fichas_tecnicas ft ON ft.produto_id = p.id
LEFT JOIN public.ficha_ingredientes fi ON fi.ficha_id = ft.id
LEFT JOIN public.estoque_itens ei ON ei.id = fi.estoque_item_id
GROUP BY p.id, p.nome, p.preco;
