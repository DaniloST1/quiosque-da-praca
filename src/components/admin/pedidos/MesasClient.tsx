'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, QrCode, RefreshCw } from 'lucide-react';

export function MesasClient() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [novoNumero, setNovoNumero] = useState('');

  const fetchMesas = async () => {
    const { data } = await supabase.from('mesas').select('*').order('numero');
    if (data) setMesas(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchMesas(); 

    const channel = supabase.channel('mesas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
        fetchMesas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const adicionarMesa = async () => {
    const num = parseInt(novoNumero);
    if (!num || num < 1) return alert('Informe um número válido.');
    if (mesas.some(m => m.numero === num)) return alert(`Mesa ${num} já existe.`);

    setAdding(true);
    const { error } = await supabase.from('mesas').insert({ numero: num });
    if (!error) {
      setNovoNumero('');
    } else {
      alert('Erro ao adicionar mesa: ' + error.message);
    }
    setAdding(false);
  };

  const removerMesa = async (id: string, numero: number) => {
    if (!confirm(`Remover Mesa ${numero}? Pedidos vinculados serão mantidos.`)) return;
    await supabase.from('mesas').delete().eq('id', id);
  };

  const gerarNovoQR = async (id: string) => {
    const novoToken = crypto.randomUUID();
    await supabase.from('mesas').update({ qr_token: novoToken }).eq('id', id);
  };

  const getQrUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/mesa/${token}`;
    }
    return `/mesa/${token}`;
  };

  const statusColors: Record<string, string> = {
    livre: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ocupada: 'bg-amber-100 text-amber-700 border-amber-200',
    aguardando_conta: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    livre: '✅ Livre',
    ocupada: '🍔 Ocupada',
    aguardando_conta: '💳 Ag. Conta',
  };

  const livresCount = mesas.filter(m => m.status === 'livre').length;
  const ocupadasCount = mesas.filter(m => m.status === 'ocupada').length;
  const aguardandoCount = mesas.filter(m => m.status === 'aguardando_conta').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Mapa de Mesas</h1>
          <p className="text-zinc-500 mt-1">Visão em tempo real do salão</p>
        </div>
        <button onClick={fetchMesas} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-zinc-500">Total</p>
          <p className="text-2xl font-black text-zinc-900">{mesas.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-emerald-700">Livres</p>
          <p className="text-2xl font-black text-emerald-800">{livresCount}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-amber-700">Ocupadas</p>
          <p className="text-2xl font-black text-amber-800">{ocupadasCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-red-700">Aguardando Conta</p>
          <p className="text-2xl font-black text-red-800">{aguardandoCount}</p>
        </div>
      </div>

      {/* Adicionar Mesa */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Adicionar Nova Mesa</h2>
        <div className="flex gap-3 max-w-md">
          <input
            type="number"
            placeholder="Número (ex: 5)"
            value={novoNumero}
            onChange={e => setNovoNumero(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarMesa()}
            className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm"
          />
          <button
            onClick={adicionarMesa}
            disabled={adding || !novoNumero}
            className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition"
          >
            <Plus className="w-5 h-5" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de Mesas */}
      {loading ? (
        <div className="text-center py-16 text-zinc-400">Carregando mesas...</div>
      ) : mesas.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nenhuma mesa cadastrada ainda.</p>
          <p className="text-sm mt-1">Adicione a primeira mesa acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mesas.map(mesa => (
            <div key={mesa.id} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-black text-zinc-700">{mesa.numero}</span>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Mesa {mesa.numero}</p>
                    {mesa.nome && <p className="text-xs text-zinc-500">{mesa.nome}</p>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${statusColors[mesa.status] || statusColors.livre}`}>
                  {statusLabels[mesa.status] || 'Livre'}
                </span>
              </div>

              <div className="bg-zinc-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-zinc-500 mb-1 font-medium">URL do QR Code</p>
                <p className="text-xs text-zinc-700 font-mono break-all">/mesa/{mesa.qr_token?.substring(0, 16)}...</p>
              </div>

              <div className="flex gap-2">
                <a
                  href={getQrUrl(mesa.qr_token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-bold py-2.5 rounded-lg transition"
                >
                  <QrCode className="w-4 h-4" />
                  Ver QR Code
                </a>
                <button
                  onClick={() => gerarNovoQR(mesa.id)}
                  title="Gerar novo QR Code"
                  className="p-2.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removerMesa(mesa.id, mesa.numero)}
                  title="Remover mesa"
                  className="p-2.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
