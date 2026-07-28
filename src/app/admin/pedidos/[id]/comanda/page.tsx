import { ComandaClient } from '@/components/admin/pedidos/comanda/ComandaClient';

export const metadata = { title: 'Imprimir Comanda | Admin' };

export default function ComandaPage({ params }: { params: { id: string } }) {
  return <ComandaClient pedidoId={params.id} />;
}
