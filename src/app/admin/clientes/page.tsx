import { Suspense } from 'react';
import { ClientesAdminClient } from '@/components/admin/clientes/ClientesAdminClient';

export const metadata = { title: 'Clientes — Quiosque Admin' };

export default function ClientesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
        <p className="text-zinc-500 text-sm mt-1">Gerencie o cadastro e histórico dos seus clientes.</p>
      </div>
      <Suspense fallback={<div className="text-zinc-400 text-sm">Carregando clientes...</div>}>
        <ClientesAdminClient />
      </Suspense>
    </div>
  );
}
