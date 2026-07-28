import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CardapioAdminClient } from '@/components/admin/vitrine/CardapioAdminClient';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CardapioPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: categorias } = await supabase.from('categorias').select('id, nome').order('ordem');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/vitrine" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Nosso Cardápio</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie produtos e categorias</p>
        </div>
      </div>

      <CardapioAdminClient initialCategorias={categorias || []} />
    </div>
  );
}
