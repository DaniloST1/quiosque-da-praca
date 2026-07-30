import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/minha-conta';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session?.user) {
      const user = data.session.user;
      const adminSupabase = createAdminClient();

      // Garantir que exista um perfil na tabela 'clientes'
      const { data: cliente } = await adminSupabase
        .from('clientes')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!cliente) {
        const meta = user.user_metadata || {};
        const nome = meta.full_name || meta.name || user.email?.split('@')[0] || 'Cliente';
        await adminSupabase.from('clientes').insert({
          auth_user_id: user.id,
          nome,
          email: user.email,
          foto_url: meta.avatar_url || meta.picture || null,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
