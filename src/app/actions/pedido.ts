'use server';

import { createAdminClient } from '@/lib/supabase';

interface PedidoItemDTO {
  produto_id: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacoes?: string;
  removidos?: { id: string; nome: string }[];
  adicionais?: { id: string; nome: string; preco: number }[];
}

interface CreatePedidoDTO {
  cliente_nome: string;
  cliente_telefone: string;
  cliente_id?: string;
  tipo: 'local' | 'delivery' | 'retirada';
  mesa_id?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    complemento?: string;
  };
  observacoes?: string;
  metodo_pagamento?: string;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  itens: PedidoItemDTO[];
}

export async function createPedido(data: CreatePedidoDTO) {
  const supabase = createAdminClient();

  try {
    // 1. Insert Pedido (sem cliente_id para compatibilidade antes da migração SQL)
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        cliente_nome: data.cliente_nome,
        cliente_tel: data.cliente_telefone,
        tipo: data.tipo,
        status: 'novo',
        mesa_id: data.mesa_id || null,
        cliente_cep: data.endereco?.cep || null,
        cliente_endereco: data.endereco?.logradouro || null,
        cliente_numero: data.endereco?.numero || null,
        cliente_bairro: data.endereco?.bairro || null,
        subtotal: data.subtotal,
        taxa_entrega: data.taxa_entrega,
        total: data.total,
        observacoes: data.observacoes || null,
        metodo_pagamento: data.metodo_pagamento || null
      })
      .select('id, numero')
      .single();

    if (pedidoError) throw pedidoError;

    // 1.1. Vincular cliente_id silenciosamente
    if (data.cliente_id) {
      try {
        await supabase.from('pedidos').update({ cliente_id: data.cliente_id }).eq('id', pedido.id);
      } catch {}
    }

    // 2. Insert Itens
    const itensToInsert = data.itens.map(item => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      nome: item.nome,
      preco: item.preco,
      quantidade: item.quantidade,
      observacoes: item.observacoes || null
    }));

    const { data: insertedItens, error: itensError } = await supabase
      .from('pedido_itens')
      .insert(itensToInsert)
      .select('id, produto_id');

    if (itensError) {
      await supabase.from('pedidos').delete().eq('id', pedido.id);
      throw itensError;
    }

    // 3. Insert Personalizações (removidos + adicionais) per item
    const personalizacoes: any[] = [];

    if (insertedItens) {
      for (const insertedItem of insertedItens) {
        const originalItem = data.itens.find(i => i.produto_id === insertedItem.produto_id);
        if (!originalItem) continue;

        // Removidos
        for (const rem of originalItem.removidos || []) {
          personalizacoes.push({
            pedido_item_id: insertedItem.id,
            ingrediente_id: rem.id,
            tipo: 'removido'
          });
        }

        // Adicionais
        for (const adic of originalItem.adicionais || []) {
          personalizacoes.push({
            pedido_item_id: insertedItem.id,
            ingrediente_id: adic.id,
            tipo: 'adicionado'
          });
        }
      }
    }

    if (personalizacoes.length > 0) {
      await supabase.from('pedido_item_personalizacao').insert(personalizacoes);
    }

    return { success: true, pedido };
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    return { success: false, error: error.message };
  }
}
