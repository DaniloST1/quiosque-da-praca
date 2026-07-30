import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente_id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal } = body;

    if (!cliente_id || !logradouro || !numero || !bairro) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Se marcado como principal, desmarca os outros primeiros
    if (principal) {
      await supabase
        .from('cliente_enderecos')
        .update({ principal: false })
        .eq('cliente_id', cliente_id);
    }

    const { data, error } = await supabase
      .from('cliente_enderecos')
      .insert({
        cliente_id,
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
