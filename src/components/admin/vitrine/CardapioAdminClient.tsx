'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { GaleriaProdutoModal } from './GaleriaProdutoModal';
import { AdicionaisProdutoModal } from './AdicionaisProdutoModal';

export function CardapioAdminClient({ initialCategorias }: { initialCategorias: any[] }) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<any>(null);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const router = useRouter();
  
  const [galeriaModalOpen, setGaleriaModalOpen] = useState(false);
  const [adicionaisModalOpen, setAdicionaisModalOpen] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState('');

  const fetchProdutos = async () => {
    setLoading(true);
    const { data } = await supabase.from('produtos').select('*, categoria:categorias(nome)').order('nome');
    if (data) setProdutos(data);
    setLoading(false);
  };

  useEffect(() => { fetchProdutos(); }, []);

  const handleEdit = (prod: any) => {
    setEditingProduto(prod);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduto({ nome: '', preco: 0, categoria_id: initialCategorias[0]?.id || '', ativo: true });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduto.id) {
      await supabase.from('produtos').update(editingProduto).eq('id', editingProduto.id);
    } else {
      await supabase.from('produtos').insert([editingProduto]);
    }
    setIsModalOpen(false);
    fetchProdutos();
  };

  const confirmDelete = (id: string) => {
    setProdutoToDelete(id);
  };

  const handleDelete = async () => {
    if (!produtoToDelete) return;
    
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'produtos', id: produtoToDelete })
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        alert('Erro ao excluir: ' + (data.error || 'Erro desconhecido. O produto pode estar vinculado a pedidos passados.'));
      } else {
        alert('Produto excluído com sucesso!');
        fetchProdutos();
        router.refresh();
      }
    } catch (err: any) {
      alert('Erro na requisição: ' + err.message);
    } finally {
      setProdutoToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <h2 className="text-xl font-bold text-zinc-900">Produtos do Cardápio</h2>
        <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Novo Produto</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Preço</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
            ) : produtos.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-6 py-4 font-medium text-zinc-900">{p.nome}</td>
                <td className="px-6 py-4 text-zinc-500">{p.categoria?.nome || '-'}</td>
                <td className="px-6 py-4 font-bold text-zinc-700">{formatCurrency(p.preco)}</td>
                <td className="px-6 py-4">
                  {p.ativo ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button onClick={() => { setSelectedProdutoId(p.id); setGaleriaModalOpen(true); }} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors" title="Gerenciar Galeria de Fotos"><ImageIcon className="w-4 h-4" /></button>
                  <button onClick={() => { setSelectedProdutoId(p.id); setAdicionaisModalOpen(true); }} className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors" title="Gerenciar Adicionais Pagos"><Sparkles className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Produto"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => confirmDelete(p.id)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Produto"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GaleriaProdutoModal 
        isOpen={galeriaModalOpen} 
        onClose={() => setGaleriaModalOpen(false)} 
        produtoId={selectedProdutoId} 
      />

      <AdicionaisProdutoModal
        isOpen={adicionaisModalOpen}
        onClose={() => setAdicionaisModalOpen(false)}
        produtoId={selectedProdutoId}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduto?.id ? "Editar Produto" : "Novo Produto"} className="max-w-[580px]">
        <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2" value={editingProduto?.nome || ''} onChange={e => setEditingProduto({...editingProduto, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Preço (R$)</label>
              <input required type="number" step="0.01" className="w-full border rounded-lg px-3 py-2" value={editingProduto?.preco || 0} onChange={e => setEditingProduto({...editingProduto, preco: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select className="w-full border rounded-lg px-3 py-2 bg-white" value={editingProduto?.categoria_id || ''} onChange={e => setEditingProduto({...editingProduto, categoria_id: e.target.value})}>
                {initialCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1">Imagem Principal</label>
                <p className="text-xs text-zinc-500 mb-2">Para alterar a imagem principal e adicionar fotos adicionais, salve as informações básicas e clique no botão de "Fotos" na tabela.</p>
              </div>
            </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição Curta</label>
            <textarea className="w-full border rounded-lg px-3 py-2" value={editingProduto?.descricao || ''} onChange={e => setEditingProduto({...editingProduto, descricao: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição Completa</label>
            <textarea className="w-full border rounded-lg px-3 py-2" value={editingProduto?.descricao_completa || ''} onChange={e => setEditingProduto({...editingProduto, descricao_completa: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editingProduto?.ativo ?? true} onChange={e => setEditingProduto({...editingProduto, ativo: e.target.checked})} className="accent-[var(--color-primary)] w-4 h-4" />
              Ativo
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editingProduto?.best_seller ?? false} onChange={e => setEditingProduto({...editingProduto, best_seller: e.target.checked})} className="accent-[var(--color-primary)] w-4 h-4" />
              Mais Vendido
            </label>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">Salvar Produto</Button>
          </div>
        </form>
      </Modal>

      {produtoToDelete && (
        <Modal isOpen={true} onClose={() => setProdutoToDelete(null)} title="Confirmar Exclusão">
          <div className="p-6">
            <p className="text-zinc-600 mb-6">
              Tem certeza que deseja excluir este produto? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setProdutoToDelete(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir Produto</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
