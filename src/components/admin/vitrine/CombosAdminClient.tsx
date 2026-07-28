'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function CombosAdminClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('combos').select('*').order('ordem');
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...rest } = editingItem;
    if (id) {
      await supabase.from('combos').update(rest).eq('id', id);
    } else {
      await supabase.from('combos').insert([rest]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este combo?')) return;
    await supabase.from('combos').delete().eq('id', id);
    fetchData();
  };

  const handleToggle = async (item: any) => {
    await supabase.from('combos').update({ ativo: !item.ativo }).eq('id', item.id);
    fetchData();
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Combos Especiais</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os combos exibidos na vitrine</p>
        </div>
        <Button onClick={() => { setEditingItem({ nome: '', descricao: '', preco: 0, imagem: '', ativo: true, ordem: items.length + 1 }); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Combo
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-4">Imagem</th>
              <th className="px-4 py-4">Nome</th>
              <th className="px-4 py-4">Preço</th>
              <th className="px-4 py-4">Ordem</th>
              <th className="px-4 py-4">Ativo</th>
              <th className="px-4 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Nenhum combo cadastrado.</td></tr>
            ) : items.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  {p.imagem
                    ? <img src={p.imagem} alt="" className="w-12 h-12 object-cover rounded-lg bg-zinc-100" />
                    : <div className="w-12 h-12 bg-zinc-100 rounded-lg" />
                  }
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-900">{p.nome}</td>
                <td className="px-4 py-3 font-bold text-[var(--color-primary)]">{formatCurrency(p.preco)}</td>
                <td className="px-4 py-3 text-zinc-500">{p.ordem}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(p)}>
                    {p.ativo ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? 'Editar Combo' : 'Novo Combo'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.nome || ''} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea className="w-full border rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.descricao || ''} onChange={e => setEditingItem({...editingItem, descricao: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL da Imagem</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.imagem || ''} onChange={e => setEditingItem({...editingItem, imagem: e.target.value})} placeholder="https://..." />
            {editingItem?.imagem && <img src={editingItem.imagem} alt="" className="mt-2 h-24 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Preço (R$)</label>
              <input required type="number" step="0.01" min="0" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.preco || 0} onChange={e => setEditingItem({...editingItem, preco: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.ordem || 0} onChange={e => setEditingItem({...editingItem, ordem: parseInt(e.target.value)})} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editingItem?.ativo ?? true} onChange={e => setEditingItem({...editingItem, ativo: e.target.checked})} className="w-4 h-4 accent-[var(--color-primary)]" />
            <span className="text-sm font-medium">Ativo (visível no site)</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancelar</button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
