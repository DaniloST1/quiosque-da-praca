'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, TrendingUp, TrendingDown, DollarSign, X, Filter } from 'lucide-react';

type Tipo = 'receita' | 'despesa';

interface Movimentacao {
  id: string; tipo: Tipo; descricao: string; valor: number; data: string;
  metodo: string | null; observacoes: string | null;
  categoria?: { nome: string; cor: string };
}

interface Categoria { id: string; nome: string; tipo: Tipo; cor: string; }

export function FinanceiroClient() {
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | Tipo>('todos');
  const [mesFiltro, setMesFiltro] = useState(format(new Date(), 'yyyy-MM'));
  const [form, setForm] = useState({ tipo: 'receita' as Tipo, categoria_id: '', descricao: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), metodo: 'pix', observacoes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const inicioMes = `${mesFiltro}-01`;
    const fimMes = `${mesFiltro}-31`;
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('financeiro_movimentacoes').select('*, categoria:financeiro_categorias(nome, cor)')
        .gte('data', inicioMes).lte('data', fimMes).order('data', { ascending: false }),
      supabase.from('financeiro_categorias').select('*').eq('ativa', true).order('nome'),
    ]);
    if (m) setMovs(m as any);
    if (c) setCategorias(c);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [mesFiltro]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('financeiro_movimentacoes').insert({
      tipo: form.tipo, categoria_id: form.categoria_id || null,
      descricao: form.descricao, valor: Number(form.valor),
      data: form.data, metodo: form.metodo || null, observacoes: form.observacoes || null
    });
    setShowForm(false);
    setForm({ tipo: 'receita', categoria_id: '', descricao: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), metodo: 'pix', observacoes: '' });
    setSaving(false);
    fetchData();
  };

  const filtradas = movs.filter(m => tipoFiltro === 'todos' || m.tipo === tipoFiltro);
  const totalReceitas = movs.filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0);
  const totalDespesas = movs.filter(m => m.tipo === 'despesa').reduce((s, m) => s + Number(m.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const catsFiltradas = categorias.filter(c => c.tipo === form.tipo);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Financeiro</h1>
          <p className="text-zinc-500 mt-1">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/financeiro/importacoes" className="flex items-center gap-2 bg-zinc-100 text-zinc-700 font-bold px-4 py-2.5 rounded-xl hover:bg-zinc-200">
            Importar CSV
          </a>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Nova Movimentação
          </button>
        </div>
      </div>

      {/* Filtro de Mês */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="border border-zinc-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        {(['todos', 'receita', 'despesa'] as const).map(t => (
          <button key={t} onClick={() => setTipoFiltro(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${tipoFiltro === t ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
            {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-zinc-500 font-medium">Receitas</span>
          </div>
          <p className="text-2xl font-black text-green-700">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm text-zinc-500 font-medium">Despesas</span>
          </div>
          <p className="text-2xl font-black text-red-600">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-4 h-4 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm font-medium text-zinc-500">Saldo</span>
          </div>
          <p className={`text-2xl font-black ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Data</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Descrição</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Categoria</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Método</th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600">Valor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-zinc-400">Carregando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-zinc-400">Nenhuma movimentação neste período.</td></tr>
            ) : (
              filtradas.map(mov => (
                <tr key={mov.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-500">{format(new Date(mov.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{mov.descricao}</td>
                  <td className="px-4 py-3">
                    {mov.categoria ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: mov.categoria.cor + '20', color: mov.categoria.cor }}>
                        {mov.categoria.nome}
                      </span>
                    ) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 capitalize">{mov.metodo || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-base ${mov.tipo === 'receita' ? 'text-green-700' : 'text-red-600'}`}>
                      {mov.tipo === 'receita' ? '+' : '-'}{formatCurrency(mov.valor)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Nova Movimentação */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-5">
              <h3 className="text-lg font-bold">Nova Movimentação</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <form onSubmit={salvar} className="grid grid-cols-2 gap-4">
              {/* Tipo toggle */}
              <div className="col-span-2 flex bg-zinc-100 rounded-xl p-1">
                <button type="button" onClick={() => setForm(f => ({ ...f, tipo: 'receita', categoria_id: '' }))} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${form.tipo === 'receita' ? 'bg-green-500 text-white shadow' : 'text-zinc-500'}`}>✅ Receita</button>
                <button type="button" onClick={() => setForm(f => ({ ...f, tipo: 'despesa', categoria_id: '' }))} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${form.tipo === 'despesa' ? 'bg-red-500 text-white shadow' : 'text-zinc-500'}`}>📤 Despesa</button>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Descrição</label>
                <input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Valor (R$)</label>
                <input required type="number" step="0.01" min="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Data</label>
                <input required type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Categoria</label>
                <select value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Sem categoria</option>
                  {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Método</label>
                <select value={form.metodo} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="ifood">iFood</option>
                  <option value="delivery">Delivery</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Observações (opcional)</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-zinc-200 rounded-xl py-2.5 text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white ${form.tipo === 'receita' ? 'bg-green-600' : 'bg-red-500'}`}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
