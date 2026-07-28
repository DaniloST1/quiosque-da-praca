'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { uploadImage } from '@/lib/storage';
import { Banner } from '@/types/database';

export function BannersAdminClient() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('ordem');
    if (data) setItems(data as Banner[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (banner?: Banner) => {
    setDesktopFile(null);
    setMobileFile(null);
    if (banner) {
      setEditingItem(banner);
    } else {
      setEditingItem({ titulo: '', ativo: true, ordem: 0, media_tipo: 'imagem' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    
    try {
      let finalDesktopUrl = editingItem.media_url_desktop;
      let finalMobileUrl = editingItem.media_url_mobile;

      if (desktopFile) {
        finalDesktopUrl = await uploadImage('banners', desktopFile);
      }
      if (mobileFile) {
        finalMobileUrl = await uploadImage('banners', mobileFile);
      }

      const payload = {
        ...editingItem,
        media_url_desktop: finalDesktopUrl,
        media_url_mobile: finalMobileUrl,
        // Fallback for older code reading 'imagem'
        imagem: finalDesktopUrl || editingItem.imagem,
      };

      if (payload.id) {
        const { error } = await supabase.from('banners').update(payload).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert([payload]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'desktop') setDesktopFile(file);
    else setMobileFile(file);
  };

  const getMediaName = (url?: string | null) => {
    if (!url) return 'Nenhuma mídia vinculada';
    return url.split('/').pop()?.split('?')[0] || 'Mídia';
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <h2 className="text-xl font-bold text-zinc-900">Banners (Hero)</h2>
        <Button onClick={() => openModal()} className="gap-2"><Plus className="w-4 h-4" /> Novo Banner</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4">Título</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ordem</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center">Carregando...</td></tr> : items.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-6 py-4 font-medium text-zinc-900">{p.titulo}</td>
                <td className="px-6 py-4">{p.ativo ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}</td>
                <td className="px-6 py-4">{p.ordem}</td>
                <td className="px-6 py-4">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? "Editar Banner" : "Novo Banner"}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2" value={editingItem?.titulo || ''} onChange={e => setEditingItem({...editingItem, titulo: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <textarea className="w-full border rounded-lg px-3 py-2 min-h-[80px] resize-y" value={editingItem?.subtitulo || ''} onChange={e => setEditingItem({...editingItem, subtitulo: e.target.value})} />
          </div>
          
          <div className="pt-4 border-t border-zinc-100">
            <h3 className="font-semibold text-sm mb-3">Mídia (Desktop e Mobile)</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Mídia</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="media_tipo" checked={editingItem?.media_tipo === 'imagem'} onChange={() => setEditingItem({...editingItem, media_tipo: 'imagem'})} /> Imagem
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="media_tipo" checked={editingItem?.media_tipo === 'video'} onChange={() => setEditingItem({...editingItem, media_tipo: 'video'})} /> Vídeo
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Desktop Upload */}
              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 flex flex-col">
                <label className="block text-sm font-medium mb-1">Upload para Desktop</label>
                <p className="text-xs text-zinc-500 mb-4 flex-1">{desktopFile ? desktopFile.name : getMediaName(editingItem?.media_url_desktop || editingItem?.imagem)}</p>
                <input 
                  type="file" 
                  ref={desktopInputRef} 
                  className="hidden" 
                  accept={editingItem?.media_tipo === 'video' ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/webp'} 
                  onChange={e => handleFileChange(e, 'desktop')} 
                />
                <button type="button" onClick={() => desktopInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-2 border border-orange-500 text-orange-500 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors">
                  <UploadCloud className="w-4 h-4" /> Selecionar Arquivo Desktop
                </button>
              </div>

              {/* Mobile Upload */}
              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 flex flex-col">
                <label className="block text-sm font-medium mb-1">Upload para Mobile</label>
                <p className="text-xs text-zinc-500 mb-4 flex-1">{mobileFile ? mobileFile.name : getMediaName(editingItem?.media_url_mobile)}</p>
                <input 
                  type="file" 
                  ref={mobileInputRef} 
                  className="hidden" 
                  accept={editingItem?.media_tipo === 'video' ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/webp'} 
                  onChange={e => handleFileChange(e, 'mobile')} 
                />
                <button type="button" onClick={() => mobileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-2 border border-orange-500 text-orange-500 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors">
                  <UploadCloud className="w-4 h-4" /> Selecionar Arquivo Mobile
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={editingItem?.ordem || 0} onChange={e => setEditingItem({...editingItem, ordem: parseInt(e.target.value)})} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editingItem?.ativo ?? true} onChange={e => setEditingItem({...editingItem, ativo: e.target.checked})} /> Ativo
            </label>
          </div>
          
          <button type="submit" className="w-full bg-[#e27826] hover:bg-[#c96a22] text-white py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  );
}
