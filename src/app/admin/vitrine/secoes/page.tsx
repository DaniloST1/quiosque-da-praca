import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecoesVisibilidadeClient } from './SecoesVisibilidadeClient';

export default async function SecoesPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: secoes } = await supabase
    .from('secoes_site')
    .select('*')
    .order('ordem', { ascending: true });

  return <SecoesVisibilidadeClient secoes={secoes || []} />;
}
