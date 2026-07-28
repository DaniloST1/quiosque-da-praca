import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// This route uses the service role key to bypass RLS for admin delete operations
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Reuse the DELETE logic for POST requests
  try {
    const { table, id } = await request.json();

    const allowedTables = ['promocoes', 'produtos', 'galeria', 'avaliacoes', 'banners', 'combos'];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Tabela não permitida' }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    console.log(`[Admin Delete] Iniciando exclusão. Tabela: ${table}, ID: ${id}`);
    const { error, count, data } = await adminSupabase.from(table).delete({ count: 'exact' }).eq('id', id).select();
    console.log(`[Admin Delete] Resultado DB:`, { error, count, data });

    if (error) {
      console.error('[Admin Delete] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
      console.warn(`[Admin Delete] Nenhum registro deletado. Tabela: ${table}, ID: ${id}`);
      return NextResponse.json({ error: 'Nenhum registro encontrado para exclusão (ou trigger cancelou a operação)' }, { status: 404 });
    }

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    console.error('[Admin Delete] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Keep existing DELETE handler for backward compatibility
export async function DELETE(request: NextRequest) {
  // Reuse POST logic
  return POST(request);
}
