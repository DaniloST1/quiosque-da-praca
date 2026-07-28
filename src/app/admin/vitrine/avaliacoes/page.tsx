import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AvaliacoesAdminClient } from '@/components/admin/vitrine/AvaliacoesAdminClient';

export default function AvaliacoesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/vitrine" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Avaliações</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie e modere os depoimentos dos clientes</p>
        </div>
      </div>
      <AvaliacoesAdminClient />
    </div>
  );
}
