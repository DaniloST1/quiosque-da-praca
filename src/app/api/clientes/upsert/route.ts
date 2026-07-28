import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizarTelefone(tel: string): string {
  return tel.replace(/\D/g, '');
}

// POST /api/clientes/upsert
// Body: { nome, email, telefone, endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado }, aceita_whatsapp }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, endereco, aceita_whatsapp } = body;

    if (!telefone || !nome) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 });
    }

    const tel_norm = normalizarTelefone(telefone);

    // Upsert: cria ou atualiza baseado no telefone_normalizado
    const { data, error } = await adminSupabase
      .from('clientes')
      .upsert(
        {
          nome,
          email: email || null,
          telefone,
          telefone_normalizado: tel_norm,
          endereco: endereco || {},
          aceita_whatsapp: aceita_whatsapp !== false,
        },
        { onConflict: 'telefone_normalizado', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      console.error('[Clientes/Upsert] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cliente: data });
  } catch (err: any) {
    console.error('[Clientes/Upsert] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
