'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  produtoId: string;
}

export function AdicionaisProdutoModal({ isOpen, onClose, produtoId }: Props) {
  const [adicionais, setAdicionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', preco: 0, ativo: true });
  const [saving, setSaving] = useState(false);

  const fetchAdicionais = async () => {
    if (!produtoId) return;
    setLoading(true);
    const { data } = await supabase
      .from('produto_adicionais')
      .select('*')
      .eq('produto_id', produtoId)
      .order('nome');
    
    if (data) setAdicionais(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchAdicionais();
  }, [isOpen, produtoId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from('produto_adicionais').update(formData).eq('id', editingId);
      } else {
        await supabase.from('produto_adicionais').insert([{ ...formData, produto_id: produtoId }]);
      }
      setEditingId(null);
      setFormData({ nome: '', preco: 0, ativo: true });
      fetchAdicionais();
    } catch (err) {
      alert('Erro ao salvar adicional');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (adic: any) => {
    setEditingId(adic.id);
    setFormData({ nome: adic.nome, preco: adic.preco, ativo: adic.ativo });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este adicional?')) return;
    await supabase.from('produto_adicionais').delete().eq('id', id);
    fetchAdicionais();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionais Pagos do Produto" className="max-w-[620px]">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 pb-4">
        
        {/* Formulário */}
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
          <h3 className="font-semibold text-zinc-900 mb-3">{editingId ? 'Editar Adicional' : 'Novo Adicional'}</h3>
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium mb-1 text-zinc-600">Nome (ex: Bacon extra)</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Nome do adicional" />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-medium mb-1 text-zinc-600">Preço (+)</label>
              <input required type="number" step="0.01" min="0" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" value={Number.isNaN(formData.preco) ? '' : formData.preco} onChange={e => setFormData({...formData, preco: e.target.value === '' ? NaN : parseFloat(e.target.value)})} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="ativo" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
              <label htmlFor="ativo" className="text-sm font-medium text-zinc-700">Ativo</label>
            </div>
            <Button type="submit" disabled={saving} className="w-full md:w-auto gap-2 h-[38px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setFormData({ nome: '', preco: 0, ativo: true }); }} className="h-[38px]">Cancelar</Button>
            )}
          </form>
        </div>

        {/* Lista */}
        <div>
          {loading ? (
            <div className="py-8 text-center text-zinc-500 flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Carregando adicionais...
            </div>
          ) : adicionais.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 bg-white rounded-xl border border-zinc-200 border-dashed">
              Nenhum adicional pago configurado para este produto.
            </div>
          ) : (
            <div className="space-y-2">
              {adicionais.map(adic => (
                <div key={adic.id} className="flex justify-between items-center p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 bg-white">
                  <div>
                    <p className="font-semibold text-zinc-800 flex items-center gap-2">
                      {adic.nome}
                      {adic.ativo ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </p>
                    <p className="text-sm font-bold text-[var(--color-primary)] mt-0.5">+ {formatCurrency(adic.preco)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(adic)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(adic.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
