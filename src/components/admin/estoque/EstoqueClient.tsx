'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, AlertTriangle, Package, ArrowUp, ArrowDown, RefreshCw, X } from 'lucide-react';

const CATEGORIAS = ['carnes', 'padaria', 'bebidas', 'molhos', 'hortifruti', 'congelados', 'outros'];
const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct'];

interface EstoqueItem {
  id: string; nome: string; categoria: string;
  quantidade: number; unidade: string; quantidade_minima: number;
  custo_unitario: number | null; validade: string | null;
  fornecedor: string | null; ativo: boolean;
}

interface MovModalState {
  item: EstoqueItem | null;
  tipo: 'entrada' | 'saida' | 'ajuste';
}

export function EstoqueClient() {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [movModal, setMovModal] = useState<MovModalState>({ item: null, tipo: 'entrada' });
  const [form, setForm] = useState({ nome: '', categoria: 'outros', quantidade: '', unidade: 'un', quantidade_minima: '0', custo_unitario: '', validade: '', fornecedor: '' });
  const [movQtd, setMovQtd] = useState('');
  const [movMotivo, setMovMotivo] = useState('');

  const fetchItens = async () => {
    const { data } = await supabase.from('estoque_itens').select('*').eq('ativo', true).order('nome');
    if (data) setItens(data);
    setLoading(false);
  };

  useEffect(() => { fetchItens(); }, []);

  const salvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, quantidade: Number(form.quantidade), quantidade_minima: Number(form.quantidade_minima), custo_unitario: form.custo_unitario ? Number(form.custo_unitario) : null, validade: form.validade || null };
    await supabase.from('estoque_itens').insert(payload);
    setShowForm(false);
    setForm({ nome: '', categoria: 'outros', quantidade: '', unidade: 'un', quantidade_minima: '0', custo_unitario: '', validade: '', fornecedor: '' });
    fetchItens();
  };

  const registrarMovimentacao = async () => {
    if (!movModal.item || !movQtd) return;
    const qtd = Number(movQtd);
    const novaQtd = movModal.tipo === 'entrada'
      ? movModal.item.quantidade + qtd
      : movModal.tipo === 'saida'
        ? movModal.item.quantidade - qtd
        : qtd; // ajuste: valor absoluto

    await supabase.from('estoque_movimentacoes').insert({
      item_id: movModal.item.id, tipo: movModal.tipo, quantidade: qtd, motivo: movMotivo || null
    });
    await supabase.from('estoque_itens').update({ quantidade: novaQtd }).eq('id', movModal.item.id);
    
    setMovModal({ item: null, tipo: 'entrada' });
    setMovQtd('');
    setMovMotivo('');
    fetchItens();
  };

  const filtrados = itens.filter(i => {
    const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFiltro === 'todos' || i.categoria === catFiltro;
    return matchSearch && matchCat;
  });

  const criticos = itens.filter(i => i.quantidade <= i.quantidade_minima);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Estoque</h1>
          <p className="text-zinc-500 mt-1">{itens.length} itens cadastrados{criticos.length > 0 && <span className="text-amber-600 font-semibold"> · {criticos.length} críticos</span>}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItens} className="p-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        </div>
      </div>

      {/* Alertas críticos */}
      {criticos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Estoque Crítico</p>
            <p className="text-amber-700 text-sm">{criticos.map(i => i.nome).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', ...CATEGORIAS].map(c => (
            <button key={c} onClick={() => setCatFiltro(c)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${catFiltro === c ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Item</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Categoria</th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600">Qtd</th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600">Mín.</th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600">Custo Unit.</th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600">Validade</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-400">Carregando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-400">Nenhum item encontrado.</td></tr>
            ) : (
              filtrados.map(item => {
                const critico = item.quantidade <= item.quantidade_minima;
                return (
                  <tr key={item.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition ${critico ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {critico && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                        <span className="font-semibold text-zinc-900">{item.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 text-xs font-medium">{item.categoria}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${critico ? 'text-amber-600' : 'text-zinc-900'}`}>
                        {Number(item.quantidade).toFixed(2)} <span className="text-zinc-400 font-normal">{item.unidade}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">{Number(item.quantidade_minima).toFixed(2)} {item.unidade}</td>
                    <td className="px-4 py-3 text-right text-zinc-700">{item.custo_unitario ? formatCurrency(item.custo_unitario) : '—'}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{item.validade || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setMovModal({ item, tipo: 'entrada' })} title="Entrada" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => setMovModal({ item, tipo: 'saida' })} title="Saída" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><ArrowDown className="w-4 h-4" /></button>
                        <button onClick={() => setMovModal({ item, tipo: 'ajuste' })} title="Ajuste" className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100"><Package className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Novo Item */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-5">
              <h3 className="text-lg font-bold">Novo Item no Estoque</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <form onSubmit={salvarItem} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Nome</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Unidade</label>
                <select value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Qtd. Atual</label>
                <input required type="number" step="0.001" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Qtd. Mínima</label>
                <input type="number" step="0.001" value={form.quantidade_minima} onChange={e => setForm(f => ({ ...f, quantidade_minima: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Custo Unitário (R$)</label>
                <input type="number" step="0.01" value={form.custo_unitario} onChange={e => setForm(f => ({ ...f, custo_unitario: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Validade</label>
                <input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Fornecedor</label>
                <input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-zinc-200 rounded-xl py-2.5 text-sm font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-[var(--color-primary)] text-white rounded-xl py-2.5 text-sm font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Movimentação */}
      {movModal.item && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold capitalize">
                {movModal.tipo === 'entrada' ? '📦 Entrada' : movModal.tipo === 'saida' ? '📤 Saída' : '🔧 Ajuste'} — {movModal.item.nome}
              </h3>
              <button onClick={() => setMovModal({ item: null, tipo: 'entrada' })}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <p className="text-sm text-zinc-500 mb-4">Atual: <strong>{Number(movModal.item.quantidade).toFixed(2)} {movModal.item.unidade}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">
                  {movModal.tipo === 'ajuste' ? 'Nova Quantidade Total' : 'Quantidade'}
                </label>
                <input type="number" step="0.001" value={movQtd} onChange={e => setMovQtd(e.target.value)} placeholder="0.000" className="w-full border rounded-lg px-3 py-2 text-sm" autoFocus />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Motivo (opcional)</label>
                <input value={movMotivo} onChange={e => setMovMotivo(e.target.value)} placeholder="Ex: Compra semanal, Quebra de estoque..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMovModal({ item: null, tipo: 'entrada' })} className="flex-1 border border-zinc-200 rounded-xl py-2.5 text-sm">Cancelar</button>
                <button onClick={registrarMovimentacao} className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white ${movModal.tipo === 'entrada' ? 'bg-green-600' : movModal.tipo === 'saida' ? 'bg-red-500' : 'bg-zinc-700'}`}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
