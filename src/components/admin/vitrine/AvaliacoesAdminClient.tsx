'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function AvaliacoesAdminClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('avaliacoes').select('*').order('ordem');
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...rest } = editingItem;
    if (id) {
      await supabase.from('avaliacoes').update(rest).eq('id', id);
    } else {
      await supabase.from('avaliacoes').insert([rest]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta avaliação?')) return;
    await supabase.from('avaliacoes').delete().eq('id', id);
    fetchData();
  };

  const handleTogglePublish = async (item: any) => {
    await supabase.from('avaliacoes').update({ publicada: !item.publicada }).eq('id', item.id);
    fetchData();
  };

  const newItem = () => setEditingItem({ nome: '', texto: '', nota: 5, publicada: true, ordem: items.length + 1 });

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Avaliações de Clientes</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie e modere os depoimentos exibidos no site</p>
        </div>
        <Button onClick={() => { newItem(); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Depoimento</th>
              <th className="px-6 py-4">Nota</th>
              <th className="px-6 py-4">Ordem</th>
              <th className="px-6 py-4">Visível</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Nenhuma avaliação cadastrada.</td></tr>
            ) : items.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-6 py-4 font-semibold text-zinc-900 whitespace-nowrap">{p.nome}</td>
                <td className="px-6 py-4 text-zinc-600 max-w-[300px]">
                  <p className="line-clamp-2">{p.texto}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{p.nota}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-500">{p.ordem}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleTogglePublish(p)} title="Clique para alternar">
                    {p.publicada
                      ? <CheckCircle className="w-5 h-5 text-green-500" />
                      : <XCircle className="w-5 h-5 text-red-400" />
                    }
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? 'Editar Avaliação' : 'Nova Avaliação'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.nome || ''} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} placeholder="Ex: João Silva" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Depoimento *</label>
            <textarea required className="w-full border rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.texto || ''} onChange={e => setEditingItem({...editingItem, texto: e.target.value})} placeholder="O que o cliente disse..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nota (1 a 5)</label>
              <input type="number" min="1" max="5" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.nota || 5} onChange={e => setEditingItem({...editingItem, nota: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordem de Exibição</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.ordem || 0} onChange={e => setEditingItem({...editingItem, ordem: parseInt(e.target.value)})} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editingItem?.publicada ?? true} onChange={e => setEditingItem({...editingItem, publicada: e.target.checked})} className="w-4 h-4 accent-[var(--color-primary)]" />
            <span className="text-sm font-medium">Visível no site</span>
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
