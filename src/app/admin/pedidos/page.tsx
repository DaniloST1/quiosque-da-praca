import { KanbanClient } from '@/components/admin/pedidos/KanbanClient';
import { createAdminClient } from '@/lib/supabase';

export const revalidate = 0;

export default async function PedidosPage() {
  const supabase = createAdminClient();
  
  // Fetch initial pedidos from today (or last 24h)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(`
      *,
      itens:pedido_itens(*)
    `)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: true });

  // Calcular métricas
  let somaPreparo = 0;
  let countPreparo = 0;
  let somaEntrega = 0;
  let countEntrega = 0;

  if (pedidos) {
    pedidos.forEach(p => {
      if (p.preparo_em && p.pronto_em) {
        const diff = new Date(p.pronto_em).getTime() - new Date(p.preparo_em).getTime();
        if (diff > 0) { somaPreparo += diff; countPreparo++; }
      }
      if (p.saiu_entrega_em && p.entregue_em) {
        const diff = new Date(p.entregue_em).getTime() - new Date(p.saiu_entrega_em).getTime();
        if (diff > 0) { somaEntrega += diff; countEntrega++; }
      }
    });
  }

  const metricas = {
    tempoMedioPreparo: countPreparo > 0 ? Math.round((somaPreparo / countPreparo) / 60000) : 0, // minutos
    tempoMedioEntrega: countEntrega > 0 ? Math.round((somaEntrega / countEntrega) / 60000) : 0, // minutos
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-zinc-50">
      <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Central de Pedidos</h1>
          <p className="text-sm text-zinc-500">Gestão de Delivery e Mesas em Tempo Real</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto p-6">
        <KanbanClient initialPedidos={pedidos || []} metricas={metricas} />
      </div>
    </div>
  );
}
