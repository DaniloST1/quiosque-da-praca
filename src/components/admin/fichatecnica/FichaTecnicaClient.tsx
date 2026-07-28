'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, ChefHat, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EstoqueItem { id: string; nome: string; unidade: string; }
interface Ingrediente {
  id?: string;
  estoque_item_id: string;
  estoque_item?: EstoqueItem;
  quantidade: number;
  unidade: string;
  _temp_id?: string;
}

interface FichaTecnicaClientProps {
  produtoId: string;
  produtoNome: string;
}

export function FichaTecnicaClient({ produtoId, produtoNome }: FichaTecnicaClientProps) {
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [novoItem, setNovoItem] = useState({ estoque_item_id: '', quantidade: '', unidade: '' });

  const fetchFicha = async () => {
    const [{ data: ficha }, { data: estoque }] = await Promise.all([
      supabase.from('fichas_tecnicas').select('id, ficha_ingredientes(*, estoque_item:estoque_item_id(id, nome, unidade))').eq('produto_id', produtoId).single(),
      supabase.from('estoque_itens').select('id, nome, unidade').eq('ativo', true).order('nome'),
    ]);
    if (ficha) {
      setFichaId(ficha.id);
      setIngredientes((ficha as any).ficha_ingredientes || []);
    }
    if (estoque) setEstoqueItens(estoque);
    setLoading(false);
  };

  useEffect(() => { fetchFicha(); }, []);

  const adicionarIngrediente = () => {
    if (!novoItem.estoque_item_id || !novoItem.quantidade) return;
    const estoqueItem = estoqueItens.find(e => e.id === novoItem.estoque_item_id);
    setIngredientes(prev => [...prev, {
      estoque_item_id: novoItem.estoque_item_id,
      estoque_item: estoqueItem,
      quantidade: Number(novoItem.quantidade),
      unidade: novoItem.unidade || estoqueItem?.unidade || 'un',
      _temp_id: crypto.randomUUID(),
    }]);
    setNovoItem({ estoque_item_id: '', quantidade: '', unidade: '' });
  };

  const removerIngrediente = (idx: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== idx));
  };

  const salvarFicha = async () => {
    setSaving(true);
    let fId = fichaId;
    if (!fId) {
      const { data: novaFicha, error } = await supabase.from('fichas_tecnicas').insert({ produto_id: produtoId }).select('id').single();
      if (error || !novaFicha) { alert('Erro ao criar ficha técnica.'); setSaving(false); return; }
      fId = novaFicha.id;
      setFichaId(fId);
    }

    // Delete all existing and reinsert (simplest approach)
    await supabase.from('ficha_ingredientes').delete().eq('ficha_id', fId);
    if (ingredientes.length > 0) {
      await supabase.from('ficha_ingredientes').insert(
        ingredientes.map(i => ({
          ficha_id: fId,
          estoque_item_id: i.estoque_item_id,
          quantidade: i.quantidade,
          unidade: i.unidade,
        }))
      );
    }
    setSaving(false);
    alert('Ficha Técnica salva com sucesso!');
    fetchFicha();
  };

  const custoTotal = ingredientes.reduce((sum, ing) => {
    // We don't have cost per unit in this view directly, could enrich if needed
    return sum;
  }, 0);

  if (loading) return <div className="p-8 text-zinc-400 text-center">Carregando ficha técnica...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/cardapio" className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-black text-zinc-900">Ficha Técnica</h1>
          </div>
          <p className="text-zinc-500 mt-0.5 ml-8">{produtoNome}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Como funciona:</strong> Ao vender este produto, o sistema baixará automaticamente as quantidades dos ingredientes listados abaixo do estoque.
      </div>

      {/* Ingredientes existentes */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-zinc-900">Ingredientes ({ingredientes.length})</h2>
          {fichaId && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Ficha cadastrada</span>}
        </div>
        {ingredientes.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">Nenhum ingrediente adicionado</p>
            <p className="text-zinc-300 text-sm mt-1">Adicione os insumos abaixo</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Ingrediente (Estoque)</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600">Quantidade</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600">Unidade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((ing, idx) => (
                <tr key={ing.id || ing._temp_id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{ing.estoque_item?.nome || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      step="0.001"
                      value={ing.quantidade}
                      onChange={e => setIngredientes(prev => prev.map((i, idx2) => idx2 === idx ? { ...i, quantidade: Number(e.target.value) } : i))}
                      className="w-24 border rounded-lg px-2 py-1 text-sm text-right"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={ing.unidade}
                      onChange={e => setIngredientes(prev => prev.map((i, idx2) => idx2 === idx ? { ...i, unidade: e.target.value } : i))}
                      className="border rounded-lg px-2 py-1 text-sm bg-white"
                    >
                      {['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => removerIngrediente(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adicionar ingrediente */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <h3 className="font-bold text-zinc-900 mb-4">Adicionar Ingrediente</h3>
        {estoqueItens.length === 0 ? (
          <p className="text-zinc-400 text-sm">Nenhum item no estoque cadastrado. <Link href="/admin/estoque" className="text-[var(--color-primary)] underline">Cadastre itens no Estoque</Link> primeiro.</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            <select
              value={novoItem.estoque_item_id}
              onChange={e => {
                const item = estoqueItens.find(i => i.id === e.target.value);
                setNovoItem(n => ({ ...n, estoque_item_id: e.target.value, unidade: item?.unidade || 'un' }));
              }}
              className="flex-1 min-w-48 border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Selecione o insumo...</option>
              {estoqueItens.map(item => <option key={item.id} value={item.id}>{item.nome} ({item.unidade})</option>)}
            </select>
            <input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="Qtd"
              value={novoItem.quantidade}
              onChange={e => setNovoItem(n => ({ ...n, quantidade: e.target.value }))}
              className="w-28 border rounded-xl px-3 py-2.5 text-sm"
            />
            <select
              value={novoItem.unidade}
              onChange={e => setNovoItem(n => ({ ...n, unidade: e.target.value }))}
              className="border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button
              onClick={adicionarIngrediente}
              disabled={!novoItem.estoque_item_id || !novoItem.quantidade}
              className="flex items-center gap-2 bg-zinc-900 text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-40 hover:bg-zinc-700"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        )}
      </div>

      {/* Salvar */}
      <button
        onClick={salvarFicha}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white font-black text-lg py-4 rounded-2xl transition disabled:opacity-50"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Salvando...' : 'Salvar Ficha Técnica'}
      </button>
    </div>
  );
}
