import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// POST /api/clientes/me
// Recebe { userId, email, metadata } para buscar ou provisionar o perfil do cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, metadata } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Busca pelo auth_user_id
    let { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (cliente) {
      return NextResponse.json({ cliente });
    }

    // 2. Se não encontrou por auth_user_id, tenta buscar pelo e-mail
    if (email) {
      const { data: clientePorEmail } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (clientePorEmail) {
        // Vincula o auth_user_id ao cliente existente
        const { data: updated } = await supabase
          .from('clientes')
          .update({ auth_user_id: userId })
          .eq('id', clientePorEmail.id)
          .select()
          .single();

        return NextResponse.json({ cliente: updated || clientePorEmail });
      }
    }

    // 3. Se não existe, cria um novo perfil de cliente usando admin client (evita RLS)
    const meta = metadata || {};
    const nome = meta.full_name || meta.name || meta.nome || email?.split('@')[0] || 'Cliente';

    const { data: newCliente, error: createError } = await supabase
      .from('clientes')
      .insert({
        auth_user_id: userId,
        nome,
        email: email || null,
        foto_url: meta.avatar_url || meta.picture || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('[Clientes/Me] Erro ao criar cliente:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ cliente: newCliente });
  } catch (err: any) {
    console.error('[Clientes/Me] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
