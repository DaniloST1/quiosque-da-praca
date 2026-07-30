import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente_id, auth_user_id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal } = body;

    if (!logradouro || !numero || !bairro) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios: Rua, Número e Bairro.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let targetClienteId = cliente_id;

    // Se cliente_id não veio, busca pelo auth_user_id
    if (!targetClienteId && auth_user_id) {
      const { data: cData } = await supabase
        .from('clientes')
        .select('id')
        .eq('auth_user_id', auth_user_id)
        .maybeSingle();

      if (cData) {
        targetClienteId = cData.id;
      } else {
        // Cria o perfil do cliente no banco se ainda não existir
        const { data: newC } = await supabase
          .from('clientes')
          .insert({ auth_user_id, nome: 'Cliente' })
          .select('id')
          .single();
        if (newC) targetClienteId = newC.id;
      }
    }

    if (!targetClienteId) {
      return NextResponse.json({ error: 'Sessão inválida. Por favor faça login novamente.' }, { status: 401 });
    }

    // Se marcado como principal, desmarca os outros primeiros
    if (principal) {
      await supabase
        .from('cliente_enderecos')
        .update({ principal: false })
        .eq('cliente_id', targetClienteId);
    }

    const { data, error } = await supabase
      .from('cliente_enderecos')
      .insert({
        cliente_id: targetClienteId,
        apelido: apelido || 'Casa',
        cep: cep || '',
        logradouro,
        numero,
        complemento: complemento || null,
        bairro,
        cidade: cidade || 'São Paulo',
        estado: estado || 'SP',
        principal: !!principal,
      })
      .select()
      .single();

    if (error) {
      console.error('[Enderecos API] Error inserting:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, endereco: data });
  } catch (err: any) {
    console.error('[Enderecos API] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID ausente' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('cliente_enderecos').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
