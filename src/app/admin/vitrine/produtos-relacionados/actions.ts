'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getProdutos() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  
  const { data, error } = await supabase.from('produtos').select('id, nome, categoria:categorias(nome), preco').order('nome');
  if (error) throw new Error(error.message);
  return data;
}

export async function getRelacionados() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  
  const { data, error } = await supabase
    .from('produtos_relacionados')
    .select('*, sugerido:produtos!produtos_relacionados_produto_sugerido_id_fkey(id, nome)');
    
  if (error) throw new Error(error.message);
  return data;
}

export async function salvarRelacionados(baseId: string, sugeridosIds: string[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(c) { c.forEach(x => cookieStore.set(x.name, x.value, x.options)); } } }
  );

  // Deleta os antigos
  await supabase.from('produtos_relacionados').delete().eq('produto_base_id', baseId);

  // Insere os novos
  if (sugeridosIds.length > 0) {
    const inserts = sugeridosIds.map(id => ({ produto_base_id: baseId, produto_sugerido_id: id, origem: 'manual' }));
    await supabase.from('produtos_relacionados').insert(inserts);
  }

  revalidatePath('/admin/vitrine/produtos-relacionados');
  return { success: true };
}

export async function calcularUpsellAutomatico() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(c) { c.forEach(x => cookieStore.set(x.name, x.value, x.options)); } } }
  );

  // Busca todos os pedidos_itens e agrupa por pedido
  const { data: itens } = await supabase.from('pedido_itens').select('pedido_id, produto_id');
  if (!itens) return { success: false, message: 'Sem dados' };

  const pedidosMap: Record<string, string[]> = {};
  itens.forEach((it: any) => {
    if (!pedidosMap[it.pedido_id]) pedidosMap[it.pedido_id] = [];
    pedidosMap[it.pedido_id].push(it.produto_id);
  });

  const frequenciaMap: Record<string, Record<string, number>> = {};

  Object.values(pedidosMap).forEach(produtos => {
    // Para cada par de produtos num mesmo pedido
    for (let i = 0; i < produtos.length; i++) {
      for (let j = i + 1; j < produtos.length; j++) {
        const p1 = produtos[i];
        const p2 = produtos[j];
        if (p1 !== p2) {
          if (!frequenciaMap[p1]) frequenciaMap[p1] = {};
          if (!frequenciaMap[p2]) frequenciaMap[p2] = {};
          frequenciaMap[p1][p2] = (frequenciaMap[p1][p2] || 0) + 1;
          frequenciaMap[p2][p1] = (frequenciaMap[p2][p1] || 0) + 1;
        }
      }
    }
  });

  const novosRelacionados = [];
  for (const baseId in frequenciaMap) {
    const sugeridos = Object.entries(frequenciaMap[baseId])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // top 3

    for (const [sugId, count] of sugeridos) {
      if (count >= 2) { // mínimo 2 compras conjuntas para valer
        novosRelacionados.push({
          produto_base_id: baseId,
          produto_sugerido_id: sugId,
          origem: 'automatico',
          score_frequencia: count
        });
      }
    }
  }

  if (novosRelacionados.length > 0) {
    // Delete os antigos 'automaticos' e insere novos (preserva manuais)
    await supabase.from('produtos_relacionados').delete().eq('origem', 'automatico');
    // Para simplificar e evitar conflitos únicos na restrição, apagamos todos deste baseId
    for (const r of novosRelacionados) {
       await supabase.from('produtos_relacionados')
         .delete()
         .eq('produto_base_id', r.produto_base_id)
         .eq('produto_sugerido_id', r.produto_sugerido_id);
    }
    await supabase.from('produtos_relacionados').insert(novosRelacionados);
  }

  revalidatePath('/admin/vitrine/produtos-relacionados');
  return { success: true, count: novosRelacionados.length };
}
