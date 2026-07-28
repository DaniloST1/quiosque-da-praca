'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PedidoRow {
  id: string;
  numero: number;
  created_at: string;
  total: number;
  status: string;
  tipo: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo: { label: 'Pedido Recebido', color: 'bg-blue-100 text-blue-700' },
  pagamento_confirmado: { label: 'Pagamento Confirmado', color: 'bg-indigo-100 text-indigo-700' },
  em_preparo: { label: 'Em Preparação', color: 'bg-orange-100 text-orange-700' },
  pronto_retirada: { label: 'Pronto para Retirada', color: 'bg-purple-100 text-purple-700' },
  saiu_entrega: { label: 'Saiu para Entrega', color: 'bg-amber-100 text-amber-700' },
  concluido: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  entregue: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function PedidosPage() {
  const { cliente } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clienteId = cliente?.id;
    if (!clienteId) return;

    async function fetchPedidos() {
      setLoading(true);
      const { data } = await supabase
        .from('pedidos')
        .select('id, numero, created_at, total, status, tipo')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (data) setPedidos(data);
      setLoading(false);
    }

    fetchPedidos();
  }, [cliente?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 font-heading">Meus Pedidos</h1>
        <p className="text-xs text-zinc-500 mt-1">Acompanhe seus pedidos ativos e consulte o histórico.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-xs py-8 text-center">Carregando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-zinc-200">
          <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700">Nenhum pedido realizado</p>
          <p className="text-xs text-zinc-400 mt-1">Faça seu primeiro pedido pelo cardápio digital!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((ped) => {
            const st = STATUS_LABELS[ped.status] || { label: ped.status, color: 'bg-zinc-100 text-zinc-700' };
            const dataFmt = new Date(ped.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Link
                key={ped.id}
                href={`/minha-conta/pedidos/${ped.id}`}
                className="bg-white rounded-2xl p-5 border border-zinc-200 hover:border-[var(--color-primary)] transition-all flex items-center justify-between shadow-2xs group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900 text-base">Pedido #{ped.numero}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {dataFmt} • <span className="capitalize">{ped.tipo}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-zinc-900 text-base">{formatCurrency(ped.total)}</span>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
