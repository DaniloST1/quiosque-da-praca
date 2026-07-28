'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function PromocoesAdminClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('promocoes').select('*').order('ordem');
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...rest } = editingItem;
    if (id) {
      await supabase.from('promocoes').update(rest).eq('id', id);
    } else {
      await supabase.from('promocoes').insert([rest]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'promocoes', id: itemToDelete })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert('Erro ao excluir: ' + (data.error || 'Erro desconhecido.'));
      } else {
        alert('Promoção excluída com sucesso!');
        fetchData();
        router.refresh();
      }
    } catch (err: any) {
      alert('Erro na requisição: ' + err.message);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleToggle = async (item: any) => {
    await supabase.from('promocoes').update({ ativa: !item.ativa }).eq('id', item.id);
    fetchData();
  };

  const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Todos os dias'];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Promoções</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie as promoções exibidas na vitrine</p>
        </div>
        <Button onClick={() => { setEditingItem({ titulo: '', descricao: '', imagem: '', desconto_pct: 0, dia_semana: 'Todos os dias', ativa: true, ordem: items.length + 1 }); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Promoção
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-4">Imagem</th>
              <th className="px-4 py-4">Título</th>
              <th className="px-4 py-4">Desconto</th>
              <th className="px-4 py-4">Dia</th>
              <th className="px-4 py-4">Ativa</th>
              <th className="px-4 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Nenhuma promoção cadastrada.</td></tr>
            ) : items.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  {p.imagem
                    ? <img src={p.imagem} alt="" className="w-12 h-12 object-cover rounded-lg bg-zinc-100" />
                    : <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center"><Tag className="w-5 h-5 text-zinc-300" /></div>
                  }
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-900">{p.titulo}</td>
                <td className="px-4 py-3">
                  {p.desconto_pct ? (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{p.desconto_pct}% OFF</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500">{p.dia_semana || 'Todos'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(p)}>
                    {p.ativa ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => confirmDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? 'Editar Promoção' : 'Nova Promoção'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.titulo || ''} onChange={e => setEditingItem({...editingItem, titulo: e.target.value})} placeholder="Ex: Combo Sexta Especial" />
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
              <label className="block text-sm font-medium mb-1">Desconto (%)</label>
              <input type="number" min="0" max="100" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.desconto_pct || 0} onChange={e => setEditingItem({...editingItem, desconto_pct: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dia da Semana</label>
              <select className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[var(--color-primary)]" value={editingItem?.dia_semana || 'Todos os dias'} onChange={e => setEditingItem({...editingItem, dia_semana: e.target.value})}>
                {dias.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editingItem?.ativa ?? true} onChange={e => setEditingItem({...editingItem, ativa: e.target.checked})} className="w-4 h-4 accent-[var(--color-primary)]" />
            <span className="text-sm font-medium">Ativa (visível no site)</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancelar</button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      {itemToDelete && (
        <Modal isOpen={true} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão">
          <div className="p-6">
            <p className="text-zinc-600 mb-6">
              Tem certeza que deseja excluir esta promoção? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir Promoção</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
