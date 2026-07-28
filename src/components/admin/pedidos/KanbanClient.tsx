'use client';

import { useState, useEffect } from 'react';
import { Pedido, PedidoStatus } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Clock, MapPin, User, UtensilsCrossed, CheckCircle2, Bike, ArrowRight, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanClientProps {
  initialPedidos: any[]; // any because we joined with pedido_itens
  metricas?: {
    tempoMedioPreparo: number;
    tempoMedioEntrega: number;
  };
}

const COLUMNS: { id: PedidoStatus; label: string; color: string; icon: any }[] = [
  { id: 'novo', label: 'Novos', color: 'bg-blue-500', icon: Clock },
  { id: 'em_preparo', label: 'Em Preparo', color: 'bg-orange-500', icon: UtensilsCrossed },
  { id: 'pronto', label: 'Pronto', color: 'bg-green-500', icon: CheckCircle2 },
  { id: 'aguardando_motoboy', label: 'Ag. Motoboy', color: 'bg-purple-500', icon: Bike },
  { id: 'saiu_entrega', label: 'Saiu p/ Entrega', color: 'bg-indigo-500', icon: MapPin },
];

export function KanbanClient({ initialPedidos, metricas }: KanbanClientProps) {
  const [pedidos, setPedidos] = useState<any[]>(initialPedidos);

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase.channel('pedidos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
        if (payload.eventType === 'INSERT') {
          // A bit tricky because we need the joined items.
          // In a real app we'd fetch the single pedido here or just append it and wait for items.
          // For simplicity, we just trigger a full refetch (not optimal for high volume, but ok for now)
          fetchPedidos();
        } else if (payload.eventType === 'UPDATE') {
          setPedidos(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        } else if (payload.eventType === 'DELETE') {
          setPedidos(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPedidos = async () => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data } = await supabase
      .from('pedidos')
      .select('*, itens:pedido_itens(*)')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: true });
    
    if (data) setPedidos(data);
  };

  const updateStatus = async (id: string, currentStatus: PedidoStatus) => {
    const nextStatusMap: Record<string, PedidoStatus> = {
      'novo': 'em_preparo',
      'em_preparo': 'pronto',
      'pronto': 'aguardando_motoboy', // Or 'entregue' if type is 'retirada'/'local'
      'aguardando_motoboy': 'saiu_entrega',
      'saiu_entrega': 'entregue'
    };

    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    let next = nextStatusMap[currentStatus];
    
    // Skip delivery steps if not delivery
    if (pedido.tipo !== 'delivery' && currentStatus === 'pronto') {
      next = 'entregue';
    }

    if (!next) return;

    // Optimistic update
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: next } : p));

    // Update DB
    const updates: any = { status: next };
    // Track times
    const now = new Date().toISOString();
    if (next === 'em_preparo') updates.preparo_em = now;
    if (next === 'pronto') updates.pronto_em = now;
    if (next === 'aguardando_motoboy') updates.aguardando_motoboy_em = now;
    if (next === 'saiu_entrega') updates.saiu_entrega_em = now;
    if (next === 'entregue') updates.entregue_em = now;

    await supabase.from('pedidos').update(updates).eq('id', id);

    // Enviar para a fila do WhatsApp
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('mensagem')
      .eq('evento', next)
      .eq('ativo', true)
      .single();

    if (template && pedido.cliente_tel) {
      const mensagem = template.mensagem
        .replace('{{numero}}', pedido.numero || '')
        .replace('{{nome}}', pedido.cliente_nome || '');
      
      await supabase.from('whatsapp_mensagens').insert({
        pedido_id: pedido.id,
        telefone_destino: pedido.cliente_tel,
        mensagem,
        status: 'pendente'
      });
    }
  };

  const cancelPedido = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este pedido?')) return;
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelado' } : p));
    await supabase.from('pedidos').update({ status: 'cancelado', cancelado_em: new Date().toISOString() }).eq('id', id);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Dashboard de Métricas Colapsável */}
      {metricas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Preparo Médio (Hoje)</p>
            <p className="text-2xl font-black text-orange-600 flex items-baseline gap-1">
              {metricas.tempoMedioPreparo} <span className="text-sm font-semibold text-zinc-400">min</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Entrega Média (Hoje)</p>
            <p className="text-2xl font-black text-indigo-600 flex items-baseline gap-1">
              {metricas.tempoMedioEntrega} <span className="text-sm font-semibold text-zinc-400">min</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map(col => {
          const colPedidos = pedidos.filter(p => p.status === col.id);
          const Icon = col.icon;
          
          return (
            <div key={col.id} className="flex-shrink-0 w-80 flex flex-col bg-zinc-100/50 rounded-2xl border border-zinc-200/50">
              {/* Header */}
              <div className="p-4 border-b border-zinc-200/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg text-white ${col.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-zinc-800">{col.label}</h3>
                </div>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-zinc-500 shadow-sm border border-zinc-200">
                  {colPedidos.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {colPedidos.map(pedido => (
                  <div key={pedido.id} className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 hover:shadow-md transition-shadow relative group">
                    
                    {/* Cancel Button (Top Right on hover) */}
                    <button 
                      onClick={() => cancelPedido(pedido.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:underline bg-white px-2 py-1 rounded"
                    >
                      Cancelar
                    </button>

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-zinc-900">#{pedido.numero}</span>
                        <span className="text-xs text-zinc-400 font-medium">{format(new Date(pedido.created_at), 'HH:mm')}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider
                        ${pedido.tipo === 'delivery' ? 'bg-indigo-100 text-indigo-700' : 
                          pedido.tipo === 'mesa' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                      `}>
                        {pedido.tipo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-700 truncate">{pedido.cliente_nome}</span>
                    </div>

                    {pedido.tipo === 'delivery' && pedido.cliente_endereco && (
                      <div className="flex items-start gap-2 mb-3 text-sm text-zinc-600 bg-zinc-50 p-2 rounded-lg">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-primary)]" />
                        <span className="leading-tight">{pedido.cliente_endereco}, {pedido.cliente_numero} - {pedido.cliente_bairro}</span>
                      </div>
                    )}

                    <div className="space-y-1 mb-4">
                      {pedido.itens?.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-2 text-sm">
                          <span className="font-bold text-zinc-700 min-w-[20px]">{item.quantidade}x</span>
                          <span className="text-zinc-600 flex-1 leading-tight">{item.nome}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-auto">
                      <span className="font-black text-[var(--color-primary)]">{formatCurrency(pedido.total)}</span>
                      <div className="flex gap-2">
                        <a
                          href={`/admin/pedidos/${pedido.id}/comanda`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Imprimir Comanda"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => updateStatus(pedido.id, pedido.status)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-colors
                            ${col.id === 'novo' ? 'bg-blue-500 hover:bg-blue-600' : 
                              col.id === 'em_preparo' ? 'bg-orange-500 hover:bg-orange-600' :
                              col.id === 'pronto' ? 'bg-green-500 hover:bg-green-600' :
                              col.id === 'aguardando_motoboy' ? 'bg-purple-500 hover:bg-purple-600' :
                              'bg-indigo-500 hover:bg-indigo-600'}
                          `}
                        >
                          Avançar
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {colPedidos.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-sm font-medium text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
