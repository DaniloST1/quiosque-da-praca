import { Suspense } from 'react';
import { ClienteDetalheClient } from '@/components/admin/clientes/ClienteDetalheClient';

export const metadata = { title: 'Perfil do Cliente — Quiosque Admin' };

export default function ClienteDetalhePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Suspense fallback={<div className="text-zinc-400 text-sm">Carregando perfil...</div>}>
        <ClienteDetalheClient id={params.id} />
      </Suspense>
    </div>
  );
}
