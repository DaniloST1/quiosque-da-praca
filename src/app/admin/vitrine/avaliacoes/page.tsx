import Link from 'next/link';
import { ChevronLeft, Star } from 'lucide-react';
import { AvaliacoesAdminClient } from '@/components/admin/vitrine/AvaliacoesAdminClient';

export default function AvaliacoesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/vitrine" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            Avaliações de Clientes
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Gerencie, modere e destaque as avaliações exibidas na seção "O que dizem nossos Clientes"
          </p>
        </div>
      </div>
      <AvaliacoesAdminClient />
    </div>
  );
}

