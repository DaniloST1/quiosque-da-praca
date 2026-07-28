'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle, Flame, Bell, BellRing } from 'lucide-react';

export function CozinhaKDS() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [agora, setAgora] = useState(new Date());
  const [novoAlerta, setNovoAlerta] = useState(false);
  const prevNovosCount = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      // Play 3 quick beeps
      [0, 0.25, 0.5].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }, []);

  // Tick the clock every second to update wait times
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPedidos = async () => {
    const oitoHorasAtras = new Date();
    oitoHorasAtras.setHours(oitoHorasAtras.getHours() - 8);

    const { data } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens:pedido_itens(
          *,
          personalizacoes:pedido_item_personalizacao(
            tipo,
            ingrediente:estoque_itens(nome)
          )
        )
      `)
      .in('status', ['novo', 'em_preparo'])
      .gte('created_at', oitoHorasAtras.toISOString())
      .order('created_at', { ascending: true });

    if (data) {
      const currentNovos = data.filter(p => p.status === 'novo').length;
      if (currentNovos > prevNovosCount.current) {
        playBeep();
        setNovoAlerta(true);
        setTimeout(() => setNovoAlerta(false), 4000);
      }
      prevNovosCount.current = currentNovos;
      setPedidos(data);
    }
  };

  useEffect(() => {
    fetchPedidos();

    const channel = supabase.channel('kds_pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchPedidos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getMinutosEspera = (createdAt: string) => {
    const diff = agora.getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const marcarEmPreparo = async (id: string) => {
    await supabase.from('pedidos').update({ 
      status: 'em_preparo', 
      preparo_em: new Date().toISOString() 
    }).eq('id', id);
  };

  const marcarPronto = async (id: string) => {
    await supabase.from('pedidos').update({ 
      status: 'pronto', 
      pronto_em: new Date().toISOString() 
    }).eq('id', id);
  };

  const novos = pedidos.filter(p => p.status === 'novo');
  const emPreparo = pedidos.filter(p => p.status === 'em_preparo');

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Alerta de Novo Pedido */}
      {novoAlerta && (
        <div className="fixed top-0 inset-x-0 z-50 bg-blue-600 text-white text-center py-3 font-black text-lg flex items-center justify-center gap-3 animate-pulse">
          <BellRing className="w-6 h-6" />
          NOVO PEDIDO CHEGOU!
          <BellRing className="w-6 h-6" />
        </div>
      )}
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">COZINHA KDS</h1>
          <span className="text-zinc-400 font-mono text-sm ml-4">
            {format(agora, 'HH:mm:ss')}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-black text-blue-400">{novos.length}</p>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Aguardando</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-orange-400">{emPreparo.length}</p>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Em Preparo</p>
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Coluna: Novos */}
        <div className="w-1/2 flex flex-col border-r border-zinc-800">
          <div className="bg-blue-600/20 border-b border-blue-600/30 px-6 py-3 flex items-center gap-2 shrink-0">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-blue-400 uppercase tracking-widest">Novos Pedidos</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {novos.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-600 text-sm font-medium border-2 border-dashed border-zinc-800 rounded-xl">
                Nenhum pedido novo
              </div>
            ) : (
              novos.map(pedido => {
                const minutos = getMinutosEspera(pedido.created_at);
                const urgente = minutos >= 10;
                return (
                  <div
                    key={pedido.id}
                    className={`rounded-2xl border-2 p-5 transition-all ${
                      urgente 
                        ? 'border-red-500 bg-red-950/30 animate-pulse' 
                        : 'border-blue-600/40 bg-zinc-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-3xl font-black text-white">#{pedido.numero}</span>
                        <p className="text-sm text-zinc-400 font-medium mt-0.5">{pedido.cliente_nome}</p>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${urgente ? 'text-red-400' : 'text-zinc-300'}`}>
                          <Clock className="w-4 h-4" />
                          {minutos} min
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                          pedido.tipo === 'delivery' ? 'bg-indigo-900 text-indigo-300' : 
                          pedido.tipo === 'local' ? 'bg-amber-900 text-amber-300' : 
                          'bg-emerald-900 text-emerald-300'
                        }`}>
                          {pedido.tipo}
                        </span>
                      </div>
                    </div>

                    {/* Itens */}
                    <div className="space-y-2 mb-5">
                      {pedido.itens?.map((item: any) => {
                        const removidos = (item.personalizacoes || []).filter((p: any) => p.tipo === 'removido');
                        const adicionados = (item.personalizacoes || []).filter((p: any) => p.tipo === 'adicionado');
                        const temPersonalizacao = removidos.length > 0 || adicionados.length > 0;
                        return (
                          <div key={item.id} className={`rounded-lg p-2 ${temPersonalizacao ? 'bg-orange-950/40 border border-orange-500/40' : ''}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-white w-8 shrink-0">{item.quantidade}x</span>
                              <div className="flex-1">
                                <p className="text-lg font-bold text-white leading-tight">{item.nome}</p>
                                {item.observacoes && (
                                  <p className="text-sm text-yellow-400 mt-0.5">⚠ {item.observacoes}</p>
                                )}
                              </div>
                            </div>
                            {temPersonalizacao && (
                              <div className="ml-11 mt-2 space-y-1">
                                <p className="text-xs font-black text-orange-400 uppercase tracking-widest">⚠ PERSONALIZAÇÃO</p>
                                {removidos.length > 0 && (
                                  <p className="text-sm font-bold text-red-400">REMOVER: {removidos.map((p: any) => p.ingrediente?.nome).filter(Boolean).join(', ')}</p>
                                )}
                                {adicionados.length > 0 && (
                                  <p className="text-sm font-bold text-green-400">ADICIONAR: {adicionados.map((p: any) => p.ingrediente?.nome).filter(Boolean).join(', ')}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {pedido.observacoes && (
                      <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg px-3 py-2 mb-4">
                        <p className="text-yellow-300 text-sm">📝 {pedido.observacoes}</p>
                      </div>
                    )}

                    <button
                      onClick={() => marcarEmPreparo(pedido.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-lg py-4 rounded-xl transition-all"
                    >
                      🔥 INICIAR PREPARO
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna: Em Preparo */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-orange-600/20 border-b border-orange-600/30 px-6 py-3 flex items-center gap-2 shrink-0">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-orange-400 uppercase tracking-widest">Em Preparo</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {emPreparo.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-600 text-sm font-medium border-2 border-dashed border-zinc-800 rounded-xl">
                Nenhum pedido em preparo
              </div>
            ) : (
              emPreparo.map(pedido => {
                const minInicioTotal = getMinutosEspera(pedido.created_at);
                const minPreparo = pedido.preparo_em 
                  ? Math.floor((agora.getTime() - new Date(pedido.preparo_em).getTime()) / 60000)
                  : 0;
                const urgente = minPreparo >= 15;
                return (
                  <div
                    key={pedido.id}
                    className={`rounded-2xl border-2 p-5 transition-all ${
                      urgente 
                        ? 'border-red-500 bg-red-950/30' 
                        : 'border-orange-600/40 bg-zinc-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-3xl font-black text-white">#{pedido.numero}</span>
                        <p className="text-sm text-zinc-400 font-medium mt-0.5">{pedido.cliente_nome}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${urgente ? 'text-red-400' : 'text-orange-300'}`}>
                          <Flame className="w-4 h-4" />
                          {minPreparo} min preparo
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          Total: {minInicioTotal} min
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-5">
                      {pedido.itens?.map((item: any) => {
                        const removidos = (item.personalizacoes || []).filter((p: any) => p.tipo === 'removido');
                        const adicionados = (item.personalizacoes || []).filter((p: any) => p.tipo === 'adicionado');
                        const temPersonalizacao = removidos.length > 0 || adicionados.length > 0;
                        return (
                          <div key={item.id} className={`rounded-lg p-2 ${temPersonalizacao ? 'bg-orange-950/40 border border-orange-500/40' : ''}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-white w-8 shrink-0">{item.quantidade}x</span>
                              <div className="flex-1">
                                <p className="text-lg font-bold text-white leading-tight">{item.nome}</p>
                                {item.observacoes && (
                                  <p className="text-sm text-yellow-400 mt-0.5">⚠ {item.observacoes}</p>
                                )}
                              </div>
                            </div>
                            {temPersonalizacao && (
                              <div className="ml-11 mt-2 space-y-1">
                                <p className="text-xs font-black text-orange-400 uppercase tracking-widest">⚠ PERSONALIZAÇÃO</p>
                                {removidos.length > 0 && (
                                  <p className="text-sm font-bold text-red-400">REMOVER: {removidos.map((p: any) => p.ingrediente?.nome).filter(Boolean).join(', ')}</p>
                                )}
                                {adicionados.length > 0 && (
                                  <p className="text-sm font-bold text-green-400">ADICIONAR: {adicionados.map((p: any) => p.ingrediente?.nome).filter(Boolean).join(', ')}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {pedido.observacoes && (
                      <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg px-3 py-2 mb-4">
                        <p className="text-yellow-300 text-sm">📝 {pedido.observacoes}</p>
                      </div>
                    )}

                    <button
                      onClick={() => marcarPronto(pedido.id)}
                      className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-6 h-6" />
                      PEDIDO PRONTO!
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
