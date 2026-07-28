'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function GaleriaAdminClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('galeria').select('*').order('ordem');
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) await supabase.from('galeria').update(editingItem).eq('id', editingItem.id);
    else await supabase.from('galeria').insert([editingItem]);
    setIsModalOpen(false);
    fetchData();
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <h2 className="text-xl font-bold text-zinc-900">Galeria de Fotos</h2>
        <Button onClick={() => { setEditingItem({ url: '', titulo: '', ativo: true, ordem: 0 }); setIsModalOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Nova Foto</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr><th className="px-6 py-4">Título</th><th className="px-6 py-4">URL</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Ações</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center">Carregando...</td></tr> : items.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-6 py-4 font-medium text-zinc-900">{p.titulo || 'Sem título'}</td>
                <td className="px-6 py-4 text-zinc-500 max-w-[200px] truncate">{p.url}</td>
                <td className="px-6 py-4">{p.ativo ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}</td>
                <td className="px-6 py-4"><button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? "Editar Foto" : "Nova Foto"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">URL da Imagem</label><input required type="text" className="w-full border rounded-lg px-3 py-2" value={editingItem?.url || ''} onChange={e => setEditingItem({...editingItem, url: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Título (Alt)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={editingItem?.titulo || ''} onChange={e => setEditingItem({...editingItem, titulo: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Ordem</label><input type="number" className="w-full border rounded-lg px-3 py-2" value={editingItem?.ordem || 0} onChange={e => setEditingItem({...editingItem, ordem: parseInt(e.target.value)})} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editingItem?.ativo ?? true} onChange={e => setEditingItem({...editingItem, ativo: e.target.checked})} /> Ativo</label>
          <Button type="submit" className="w-full">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
