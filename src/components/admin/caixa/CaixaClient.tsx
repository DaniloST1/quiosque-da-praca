'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lock, Unlock, DollarSign, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Sessao {
  id: string;
  status: 'aberto' | 'fechado';
  valor_abertura: number;
  valor_fechamento: number | null;
  aberto_em: string;
  fechado_em: string | null;
  observacoes: string | null;
}

interface Resumo {
  totalVendas: number;
  totalReceitas: number;
  totalDespesas: number;
  pedidosCount: number;
}

export function CaixaClient() {
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null);
  const [historico, setHistorico] = useState<Sessao[]>([]);
  const [resumo, setResumo] = useState<Resumo>({ totalVendas: 0, totalReceitas: 0, totalDespesas: 0, pedidosCount: 0 });
  const [loading, setLoading] = useState(true);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [obsAbertura, setObsAbertura] = useState('');
  const [obsFechamento, setObsFechamento] = useState('');
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);

  const fetchCaixa = async () => {
    const [{ data: sessoes }, { data: pedidosHoje }, { data: finHoje }] = await Promise.all([
      supabase.from('caixa_sessoes').select('*').order('aberto_em', { ascending: false }).limit(10),
      supabase.from('pedidos').select('total, status').gte('created_at', format(new Date(), 'yyyy-MM-dd') + 'T00:00:00').neq('status', 'cancelado'),
      supabase.from('financeiro_movimentacoes').select('tipo, valor').eq('data', format(new Date(), 'yyyy-MM-dd')),
    ]);

    if (sessoes) {
      const ativa = sessoes.find(s => s.status === 'aberto') || null;
      setSessaoAtiva(ativa);
      setHistorico(sessoes.filter(s => s.status === 'fechado').slice(0, 5));
    }

    const totalVendas = (pedidosHoje || []).reduce((s, p) => s + Number(p.total), 0);
    const pedidosCount = pedidosHoje?.length || 0;
    const totalReceitas = (finHoje || []).filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0);
    const totalDespesas = (finHoje || []).filter(m => m.tipo === 'despesa').reduce((s, m) => s + Number(m.valor), 0);
    setResumo({ totalVendas, totalReceitas, totalDespesas, pedidosCount });
    setLoading(false);
  };

  useEffect(() => { fetchCaixa(); }, []);

  const abrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('caixa_sessoes').insert({
      valor_abertura: Number(valorAbertura) || 0,
      status: 'aberto',
      observacoes: obsAbertura || null,
    });
    setShowAbrirModal(false);
    setValorAbertura('');
    setObsAbertura('');
    fetchCaixa();
  };

  const fecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessaoAtiva) return;
    await supabase.from('caixa_sessoes').update({
      status: 'fechado',
      valor_fechamento: Number(valorFechamento) || 0,
      fechado_em: new Date().toISOString(),
      observacoes: obsFechamento || sessaoAtiva.observacoes,
    }).eq('id', sessaoAtiva.id);
    setShowFecharModal(false);
    setValorFechamento('');
    setObsFechamento('');
    fetchCaixa();
  };

  if (loading) return <div className="p-8 text-zinc-400 text-center">Carregando caixa...</div>;

  const tempoAberto = sessaoAtiva
    ? Math.floor((new Date().getTime() - new Date(sessaoAtiva.aberto_em).getTime()) / 60000)
    : null;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-zinc-900">Caixa</h1>
        <p className="text-zinc-500 mt-1">Controle de abertura e fechamento do caixa</p>
      </div>

      {/* Status do Caixa */}
      <div className={`rounded-2xl border-2 p-6 ${sessaoAtiva ? 'bg-green-50 border-green-200' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${sessaoAtiva ? 'bg-green-500' : 'bg-zinc-300'}`}>
              {sessaoAtiva ? <Unlock className="w-7 h-7 text-white" /> : <Lock className="w-7 h-7 text-white" />}
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900">
                Caixa {sessaoAtiva ? 'Aberto' : 'Fechado'}
              </p>
              {sessaoAtiva ? (
                <div className="flex items-center gap-2 text-sm text-green-700 mt-0.5">
                  <Clock className="w-4 h-4" />
                  Aberto às {format(new Date(sessaoAtiva.aberto_em), 'HH:mm')} — {tempoAberto}min
                  <span className="font-medium">· Troco inicial: {formatCurrency(sessaoAtiva.valor_abertura)}</span>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-0.5">Nenhuma sessão ativa</p>
              )}
            </div>
          </div>
          <div>
            {sessaoAtiva ? (
              <button onClick={() => setShowFecharModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl">
                <Lock className="w-5 h-5" /> Fechar Caixa
              </button>
            ) : (
              <button onClick={() => setShowAbrirModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl">
                <Unlock className="w-5 h-5" /> Abrir Caixa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-blue-500" /><span className="text-sm text-zinc-500">Vendas Hoje</span></div>
          <p className="text-2xl font-black text-blue-700">{formatCurrency(resumo.totalVendas)}</p>
          <p className="text-xs text-zinc-400 mt-1">{resumo.pedidosCount} pedidos</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-zinc-500">Receitas Hoje</span></div>
          <p className="text-2xl font-black text-green-700">{formatCurrency(resumo.totalReceitas)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm text-zinc-500">Despesas Hoje</span></div>
          <p className="text-2xl font-black text-red-600">{formatCurrency(resumo.totalDespesas)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${(resumo.totalReceitas - resumo.totalDespesas) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-zinc-500" /><span className="text-sm text-zinc-500">Saldo do Dia</span></div>
          <p className={`text-2xl font-black ${(resumo.totalReceitas - resumo.totalDespesas) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(resumo.totalReceitas - resumo.totalDespesas)}
          </p>
        </div>
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="font-bold text-zinc-900">Últimas Sessões</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Abertura</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Fechamento</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600">Troco Inicial</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600">Total no Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(s => (
                <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-700">{format(new Date(s.aberto_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</td>
                  <td className="px-4 py-3 text-zinc-700">{s.fechado_em ? format(new Date(s.fechado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(s.valor_abertura)}</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900">{s.valor_fechamento != null ? formatCurrency(s.valor_fechamento) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Abrir */}
      {showAbrirModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4 text-green-700">🔓 Abrir Caixa</h3>
            <form onSubmit={abrirCaixa} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Troco Inicial (R$)</label>
                <input type="number" step="0.01" min="0" value={valorAbertura} onChange={e => setValorAbertura(e.target.value)} placeholder="0.00" className="w-full border rounded-xl px-4 py-3 text-lg font-bold" autoFocus />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Observações (opcional)</label>
                <textarea value={obsAbertura} onChange={e => setObsAbertura(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAbrirModal(false)} className="flex-1 border border-zinc-200 rounded-xl py-3 text-sm font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-sm font-bold">Abrir Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar */}
      {showFecharModal && sessaoAtiva && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-1 text-red-700">🔒 Fechar Caixa</h3>
            <p className="text-sm text-zinc-500 mb-4">Sessão aberta às {format(new Date(sessaoAtiva.aberto_em), 'HH:mm')}</p>
            <form onSubmit={fecharCaixa} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Valor Total em Caixa (R$)</label>
                <input type="number" step="0.01" min="0" value={valorFechamento} onChange={e => setValorFechamento(e.target.value)} placeholder="0.00" className="w-full border rounded-xl px-4 py-3 text-lg font-bold" autoFocus />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Observações (opcional)</label>
                <textarea value={obsFechamento} onChange={e => setObsFechamento(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFecharModal(false)} className="flex-1 border border-zinc-200 rounded-xl py-3 text-sm font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-bold">Fechar Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
