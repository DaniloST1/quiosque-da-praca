import { getPodio, getProdutos } from './actions';
import { PodioClient } from '@/components/admin/vitrine/PodioClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MaisPedidosPage() {
  const [podio, produtos] = await Promise.all([
    getPodio(),
    getProdutos()
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/vitrine" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Os Mais Pedidos</h1>
          <p className="text-zinc-500 mt-1">Gerencie os 3 produtos que ficam em destaque no topo do site.</p>
        </div>
      </div>

      <PodioClient initialPodio={podio} produtos={produtos.map((p: any) => ({
        ...p,
        categoria: Array.isArray(p.categoria) ? p.categoria[0]?.nome ?? '' : (p.categoria ?? ''),
      }))} />
    </div>
  );
}
