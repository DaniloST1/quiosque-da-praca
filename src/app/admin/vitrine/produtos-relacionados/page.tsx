import { getProdutos, getRelacionados } from './actions';
import { UpsellClient } from '@/components/admin/vitrine/UpsellClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProdutosRelacionadosPage() {
  const [produtos, relacionados] = await Promise.all([
    getProdutos(),
    getRelacionados()
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/vitrine" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produtos Relacionados (Upsell)</h1>
          <p className="text-zinc-500 mt-1">Configure quais produtos serão sugeridos juntos no modal de detalhes.</p>
        </div>
      </div>

      <UpsellClient produtos={produtos} initialRelacionados={relacionados} />
    </div>
  );
}
