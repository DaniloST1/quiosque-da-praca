'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, Search, Truck, ShoppingCart, CheckCircle, XCircle, Clock, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Fornecedor { id: string; nome: string; }
interface EstoqueItem { id: string; nome: string; unidade: string; }

interface CompraItem {
  _tempId?: string;
  estoque_item_id: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;
}

interface Compra {
  id: string;
  fornecedor_id: string | null;
  data: string;
  total: number;
  status: 'pendente' | 'concluida' | 'cancelada';
  fornecedor: Fornecedor | null;
  compra_itens: { nome: string; quantidade: number; custo_unitario: number; subtotal: number }[];
}

export function ComprasClient() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formFornecedor, setFormFornecedor] = useState('');
  const [formStatus, setFormStatus] = useState<'pendente'|'concluida'>('pendente');
  const [formObs, setFormObs] = useState('');
  const [itens, setItens] = useState<CompraItem[]>([]);
  
  // Item form states
  const [itemSel, setItemSel] = useState('');
  const [itemQtd, setItemQtd] = useState('');
  const [itemCusto, setItemCusto] = useState('');

  const fetchData = async () => {
    const [{ data: c }, { data: f }, { data: e }] = await Promise.all([
      supabase.from('compras').select('*, fornecedor:fornecedores(id, nome), compra_itens(nome, quantidade, custo_unitario, subtotal)').order('created_at', { ascending: false }),
      supabase.from('fornecedores').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('estoque_itens').select('id, nome, unidade').eq('ativo', true).order('nome')
    ]);
    if (c) setCompras(c as any);
    if (f) setFornecedores(f);
    if (e) setEstoqueItens(e);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => {
    if (!itemSel || !itemQtd || !itemCusto) return;
    const est = estoqueItens.find(e => e.id === itemSel);
    if (!est) return;
    setItens([...itens, {
      _tempId: crypto.randomUUID(),
      estoque_item_id: est.id,
      nome: est.nome,
      quantidade: Number(itemQtd),
      custo_unitario: Number(itemCusto)
    }]);
    setItemSel(''); setItemQtd(''); setItemCusto('');
  };

  const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx));

  const totalForm = itens.reduce((s, i) => s + (i.quantidade * i.custo_unitario), 0);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) return alert('Adicione pelo menos um item.');
    setSaving(true);

    // 1. Criar Compra
    const { data: novaCompra, error } = await supabase.from('compras').insert({
      fornecedor_id: formFornecedor || null,
      data: format(new Date(), 'yyyy-MM-dd'),
      total: totalForm,
      status: formStatus,
      observacoes: formObs || null
    }).select('id').single();

    if (error || !novaCompra) { alert('Erro ao salvar compra.'); setSaving(false); return; }

    // 2. Inserir itens
    // Se status for 'concluida', a trigger no banco dará entrada no estoque automaticamente!
    await supabase.from('compra_itens').insert(
      itens.map(i => ({
        compra_id: novaCompra.id,
        estoque_item_id: i.estoque_item_id,
        nome: i.nome,
        quantidade: i.quantidade,
        custo_unitario: i.custo_unitario
      }))
    );

    // 3. Se for concluída, gerar despesa no financeiro
    if (formStatus === 'concluida') {
      const fNome = formFornecedor ? fornecedores.find(f => f.id === formFornecedor)?.nome || 'Fornecedor' : 'Fornecedor';
      
      // Buscar categoria de Fornecedores
      const { data: cat } = await supabase.from('financeiro_categorias').select('id').eq('nome', 'Fornecedores').single();
      
      await supabase.from('financeiro_movimentacoes').insert({
        tipo: 'despesa',
        categoria_id: cat?.id || null,
        descricao: `Compra #${novaCompra.id.substring(0,6)} - ${fNome}`,
        valor: totalForm,
        data: format(new Date(), 'yyyy-MM-dd'),
        metodo: 'outros'
      });
    }

    setShowForm(false);
    setFormFornecedor(''); setFormStatus('pendente'); setFormObs(''); setItens([]);
    setSaving(false);
    fetchData();
  };

  const concluirCompra = async (compra: Compra) => {
    if(!confirm('Ao concluir, o estoque será atualizado e uma despesa será lançada no financeiro. Confirmar?')) return;
    
    await supabase.from('compras').update({ status: 'concluida' }).eq('id', compra.id);
    
    // Dispara a mesma lógica manualmente para as entradas de estoque...
    // (Na verdade, a trigger vai cuidar do estoque se fizermos UPDATE, mas a trigger atual foi feita para INSERT em compra_itens.
    // Vamos precisar re-processar ou lidar de forma manual para evitar duplicidade.
    // Como a trigger "trg_atualizar_estoque_compra" é ON INSERT de compra_itens, se a gente atualiza a compra pra concluída, a trigger não roda.
    // Portanto, é melhor que o usuário só crie a compra como Concluída logo de cara se já tiver a nota, ou fazemos uma stored procedure.
    // Para simplificar, vou pedir pra ele refazer ou vamos disparar manualmente aqui.)
    
    for (const item of compra.compra_itens as any) {
      // 1. Atualizar estoque
      await supabase.from('estoque_movimentacoes').insert({
        item_id: item.estoque_item_id, tipo: 'entrada', quantidade: item.quantidade, motivo: 'Entrada por Compra Atrasada'
      });
      await supabase.rpc('increment_estoque', { row_id: item.estoque_item_id, qtd: item.quantidade });
      await supabase.from('estoque_itens').update({ custo_unitario: item.custo_unitario }).eq('id', item.estoque_item_id);
    }
    
    const { data: cat } = await supabase.from('financeiro_categorias').select('id').eq('nome', 'Fornecedores').single();
    await supabase.from('financeiro_movimentacoes').insert({
      tipo: 'despesa', categoria_id: cat?.id || null,
      descricao: `Compra #${compra.id.substring(0,6)} (Baixa atrasada)`,
      valor: compra.total, data: format(new Date(), 'yyyy-MM-dd'), metodo: 'outros'
    });

    fetchData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Compras</h1>
          <p className="text-zinc-500 mt-1">Registrar notas e entradas de fornecedores</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/compras/fornecedores" className="flex items-center gap-2 bg-zinc-100 text-zinc-700 font-bold px-4 py-2.5 rounded-xl hover:bg-zinc-200">
            <Truck className="w-4 h-4" /> Fornecedores
          </Link>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Nova Compra
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Total Compras (Mês)</p>
          <p className="text-2xl font-black text-zinc-900">{formatCurrency(compras.reduce((s,c) => s + Number(c.total), 0))}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-sm font-medium text-amber-700 mb-1">Compras Pendentes</p>
          <p className="text-2xl font-black text-amber-800">{compras.filter(c => c.status === 'pendente').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Data</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Fornecedor</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-zinc-400">Carregando...</td></tr>
            ) : compras.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-zinc-400">Nenhuma compra registrada.</td></tr>
            ) : (
              compras.map(c => (
                <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-400">#{c.id.substring(0,6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-zinc-600">{format(new Date(c.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{c.fornecedor?.nome || '—'}</td>
                  <td className="px-4 py-3">
                    {c.status === 'concluida' ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Concluída</span> :
                     c.status === 'pendente' ? <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Pendente</span> :
                     <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Cancelada</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-zinc-800">{formatCurrency(c.total)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'pendente' && (
                      <button onClick={() => concluirCompra(c)} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-600">Concluir</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between shrink-0">
              <h3 className="text-xl font-bold">Nova Compra</h3>
              <button onClick={() => setShowForm(false)}><XCircle className="w-6 h-6 text-zinc-400" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-1 block">Fornecedor</label>
                  <select value={formFornecedor} onChange={e => setFormFornecedor(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="">Selecione...</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-1 block">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="concluida">Concluída (Baixa Estoque e Financeiro)</option>
                    <option value="pendente">Pendente (Apenas Rascunho)</option>
                  </select>
                </div>
              </div>

              {/* Inserir itens */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <h4 className="font-bold text-sm mb-3">Itens da Compra</h4>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <select value={itemSel} onChange={e => setItemSel(e.target.value)} className="flex-1 min-w-[150px] border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Buscar insumo...</option>
                    {estoqueItens.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.unidade})</option>)}
                  </select>
                  <input type="number" step="0.001" placeholder="Qtd" value={itemQtd} onChange={e => setItemQtd(e.target.value)} className="w-24 border rounded-lg px-3 py-2 text-sm" />
                  <input type="number" step="0.01" placeholder="R$ Custo Unit." value={itemCusto} onChange={e => setItemCusto(e.target.value)} className="w-32 border rounded-lg px-3 py-2 text-sm" />
                  <button type="button" onClick={addItem} className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-bold text-sm">Add</button>
                </div>

                <div className="space-y-2">
                  {itens.map((it, idx) => (
                    <div key={it._tempId} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                      <span className="font-medium">{it.nome}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-500">{it.quantidade}x</span>
                        <span className="text-zinc-500">{formatCurrency(it.custo_unitario)}</span>
                        <span className="font-bold text-zinc-900 w-20 text-right">{formatCurrency(it.quantidade * it.custo_unitario)}</span>
                        <button onClick={() => removeItem(idx)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {itens.length === 0 && <p className="text-sm text-zinc-400 text-center py-4">Nenhum item adicionado.</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Observações (opcional)</label>
                <textarea value={formObs} onChange={e => setFormObs(e.target.value)} rows={2} className="w-full border rounded-xl px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            <div className="p-6 border-t shrink-0 flex items-center justify-between bg-zinc-50 rounded-b-2xl">
              <div>
                <p className="text-sm font-semibold text-zinc-500">Total da Compra</p>
                <p className="text-2xl font-black text-[var(--color-primary)]">{formatCurrency(totalForm)}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-white">Cancelar</button>
                <button type="button" onClick={salvar} disabled={saving || itens.length === 0} className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Finalizar Compra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
