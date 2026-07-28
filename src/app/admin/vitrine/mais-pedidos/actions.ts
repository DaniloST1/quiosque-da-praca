'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getProdutos() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );
  
  const { data, error } = await supabase.from('produtos').select('id, nome, categoria:categorias(nome), preco').order('nome');
  if (error) throw new Error(error.message);
  return data;
}

export async function getPodio() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );
  
  const { data, error } = await supabase
    .from('mais_pedidos')
    .select('*, produto:produtos(nome)')
    .order('posicao');
    
  if (error) throw new Error(error.message);
  return data;
}

export async function salvarPodio(podioItems: { posicao: number, produto_id: string, modo: string }[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      },
    }
  );
  
  // Wipe current and insert new
  await supabase.from('mais_pedidos').delete().neq('posicao', 0);
  
  const { error } = await supabase.from('mais_pedidos').insert(podioItems);
  
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/vitrine/mais-pedidos');
  revalidatePath('/'); // update frontend site
  return { success: true };
}

export async function calcularPodioAutomatico() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      },
    }
  );

  const { data: vendas } = await supabase.from('pedido_itens').select('produto_id, quantidade, pedido:pedidos!inner(status)');
  
  const vendasMap: Record<string, number> = {};
  if (vendas) {
    vendas.forEach((v: any) => {
      if (v.pedido?.status !== 'cancelado') {
        vendasMap[v.produto_id] = (vendasMap[v.produto_id] || 0) + v.quantidade;
      }
    });
  }

  const sorted = Object.entries(vendasMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  
  const podioItems = sorted.map(([produto_id], index) => ({
    posicao: index + 1,
    produto_id,
    modo: 'automatico'
  }));

  // Se não houver vendas suficientes, não faz nada
  if (podioItems.length === 0) return { success: false, message: 'Não há vendas suficientes' };

  await supabase.from('mais_pedidos').delete().neq('posicao', 0);
  await supabase.from('mais_pedidos').insert(podioItems);

  revalidatePath('/admin/vitrine/mais-pedidos');
  revalidatePath('/');
  return { success: true, count: podioItems.length };
}
