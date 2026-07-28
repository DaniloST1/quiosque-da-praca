import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizarTelefone(tel: string): string {
  return tel.replace(/\D/g, '');
}

// GET /api/clientes/buscar?telefone=11999999999
export async function GET(request: NextRequest) {
  const telefone = request.nextUrl.searchParams.get('telefone');
  if (!telefone) {
    return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
  }

  const tel = normalizarTelefone(telefone);
  if (tel.length < 8) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
  }

  const { data, error } = await adminSupabase
    .from('clientes')
    .select('*')
    .eq('telefone_normalizado', tel)
    .maybeSingle();

  if (error) {
    console.error('[Clientes/Buscar] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cliente: data });
}
