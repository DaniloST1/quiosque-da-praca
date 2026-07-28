'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, UploadCloud, Trash2, Plus, Save, Star } from 'lucide-react';
import { uploadImage, deleteImage } from '@/lib/storage';
import { ProdutoImagem } from '@/types/database';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  produtoId: string;
}

type LocalImage = {
  id: string;
  file?: File;
  previewUrl: string;
  imagem_url: string;
  nome_arquivo: string;
  favorita: boolean;
  ordem: number;
  isNew: boolean;
  deleted: boolean;
  saving?: boolean;
  saved?: boolean;
};

export function GaleriaProdutoModal({ isOpen, onClose, produtoId }: Props) {
  const [imagens, setImagens] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchImagens = async () => {
    if (!produtoId) return;
    setLoading(true);
    const { data } = await supabase
      .from('produto_imagens')
      .select('*')
      .eq('produto_id', produtoId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (data) {
      setImagens(data.map((d, idx) => ({
        id: d.id,
        imagem_url: d.imagem_url,
        previewUrl: d.imagem_url,
        nome_arquivo: d.nome_arquivo || 'Imagem',
        favorita: d.favorita,
        ordem: d.ordem ?? idx,
        isNew: false,
        deleted: false,
        saved: true,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchImagens();
    } else {
      imagens.forEach(img => { if (img.isNew) URL.revokeObjectURL(img.previewUrl); });
      setImagens([]);
    }
  }, [isOpen, produtoId]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const existing = imagens.filter(i => !i.deleted);
    let maxOrdem = existing.length > 0 ? Math.max(...existing.map(i => i.ordem)) : -1;
    const novas: LocalImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const isFirst = existing.length === 0 && i === 0;
      novas.push({
        id: `temp-${Date.now()}-${i}`,
        file,
        previewUrl,
        imagem_url: '',
        nome_arquivo: file.name,
        favorita: isFirst,
        ordem: ++maxOrdem,
        isNew: true,
        deleted: false,
        saved: false,
      });
    }
    setImagens(prev => [...prev, ...novas]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const syncProdutoImagem = async (url: string | null) => {
    console.log('[Galeria] Atualizando produtos.imagem:', url);
    const { error } = await supabase.from('produtos').update({ imagem: url }).eq('id', produtoId);
    if (error) {
      console.error('[Galeria] Erro ao sincronizar imagem:', error.message);
    } else {
      console.log('[Galeria] produtos.imagem sincronizado com sucesso.');
      // Invalidar cache do Next.js para refletir na Landing Page
      try {
        await fetch('/api/revalidate', { method: 'POST' });
        console.log('[Galeria] Cache da Landing Page invalidado.');
      } catch (e) {
        console.warn('[Galeria] Falha ao invalidar cache:', e);
      }
      router.refresh();
    }
  };

  const handleExcluir = async (img: LocalImage) => {
    if (img.isNew) {
      URL.revokeObjectURL(img.previewUrl);
      setImagens(prev => prev.filter(i => i.id !== img.id));
    } else {
      if (!confirm(`Deseja excluir "${img.nome_arquivo}"?`)) return;
      try { await deleteImage('products', img.imagem_url); } catch {}
      await supabase.from('produto_imagens').delete().eq('id', img.id);
      
      const updated = imagens.filter(i => i.id !== img.id);
      setImagens(updated);

      if (img.favorita) {
        const nextImg = updated.find(i => !i.isNew && !i.deleted);
        if (nextImg) {
          handleFavoritar(nextImg.id);
        } else {
          syncProdutoImagem(null);
        }
      }
    }
  };

  const handleFavoritar = async (id: string) => {
    console.log('[Galeria] Imagem favorita selecionada, id:', id);
    setImagens(prev => prev.map(img => ({ ...img, favorita: img.id === id })));
    
    const img = imagens.find(i => i.id === id);
    if (img && !img.isNew) {
      await supabase.from('produto_imagens').update({ favorita: false }).eq('produto_id', produtoId);
      await supabase.from('produto_imagens').update({ favorita: true }).eq('id', id);
      await syncProdutoImagem(img.imagem_url);
    }
  };

  const handleSaveOne = async (img: LocalImage) => {
    if (!img.file) return;
    setImagens(prev => prev.map(i => i.id === img.id ? { ...i, saving: true } : i));
    try {
      const realUrl = await uploadImage('products', img.file);
      const visibleImages = imagens.filter(i => !i.isNew && !i.deleted);
      const isFirst = visibleImages.length === 0;
      const { data: inserted } = await supabase.from('produto_imagens').insert([{
        produto_id: produtoId,
        imagem_url: realUrl,
        nome_arquivo: img.nome_arquivo,
        favorita: img.favorita || isFirst,
        ordem: img.ordem
      }]).select('id').single();

      if (img.favorita || isFirst) {
        console.log('[Galeria] Imagem salva marcada como capa:', realUrl);
        await syncProdutoImagem(realUrl);
      }

      URL.revokeObjectURL(img.previewUrl);
      setImagens(prev => prev.map(i =>
        i.id === img.id
          ? { ...i, id: inserted?.id ?? i.id, imagem_url: realUrl, previewUrl: realUrl, isNew: false, saving: false, saved: true }
          : i
      ));
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
      setImagens(prev => prev.map(i => i.id === img.id ? { ...i, saving: false } : i));
    }
  };

  const handleSaveAll = async () => {
    const toSave = imagens.filter(i => i.isNew && !i.deleted && i.file);
    if (toSave.length === 0) { onClose(); return; }
    setSavingAll(true);
    for (const img of toSave) {
      await handleSaveOne(img);
    }
    setSavingAll(false);
    onClose();
    window.location.reload();
  };

  const visibleImages = imagens.filter(i => !i.deleted);
  const unsavedCount = visibleImages.filter(i => i.isNew).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload de Imagem" className="max-w-[580px]">
      <div className="flex flex-col gap-0" style={{ minHeight: '360px' }}>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            {/* ── Área de drag-and-drop ── */}
            {visibleImages.length === 0 && (
              <div
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3 mx-1 mb-5
                  rounded-xl border-2 border-dashed cursor-pointer transition-all
                  py-10 px-6 select-none
                  ${isDragging
                    ? 'border-[var(--color-primary)] bg-orange-50'
                    : 'border-zinc-300 bg-zinc-50 hover:border-[var(--color-primary)] hover:bg-orange-50/50'}
                `}
              >
                <UploadCloud className={`w-10 h-10 transition-colors ${isDragging ? 'text-[var(--color-primary)]' : 'text-zinc-400'}`} />
                <p className="text-sm text-zinc-600 font-medium">
                  Clique ou arraste uma imagem ou vídeo
                </p>
                <p className="text-xs text-zinc-400">PNG, JPG, WEBP ou MP4/WebM</p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />

            {/* ── Lista de imagens ── */}
            {visibleImages.length > 0 && (
              <div className="flex-1 overflow-y-auto mx-1">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[1fr_auto] px-3 py-2 bg-zinc-100 rounded-t-lg border border-zinc-200 border-b-0">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Arquivo</span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</span>
                </div>

                {/* Linhas */}
                <div className="border border-zinc-200 rounded-b-lg overflow-hidden divide-y divide-zinc-100">
                  {visibleImages.map((img) => (
                    <div
                      key={img.id}
                      className={`grid grid-cols-[1fr_auto] items-center px-3 py-3 transition-colors ${img.favorita ? 'bg-yellow-50' : 'bg-white hover:bg-zinc-50'}`}
                    >
                      {/* Thumb + nome */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                          <img
                            src={img.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e => e.currentTarget.style.display = 'none'}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-800 truncate max-w-[180px]" title={img.nome_arquivo}>
                            {img.nome_arquivo}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {img.favorita && (
                              <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-yellow-700" /> Capa
                              </span>
                            )}
                            {img.isNew && !img.saved && (
                              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Nova</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Favoritar */}
                        {!img.favorita && (
                          <button
                            onClick={() => handleFavoritar(img.id)}
                            title="Tornar capa"
                            className="p-1.5 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-md transition-colors"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}

                        {/* Salvar individual (só para novas) */}
                        {img.isNew && (
                          <button
                            onClick={() => handleSaveOne(img)}
                            disabled={img.saving}
                            className="px-3 py-1 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded transition-colors disabled:opacity-60 flex items-center justify-center min-w-[70px]"
                          >
                            {img.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                          </button>
                        )}

                        {/* Excluir */}
                        <button
                          onClick={() => handleExcluir(img)}
                          title="Excluir"
                          className="px-3 py-1 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão Adicionar mais */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 rounded text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <div className="flex justify-end items-center gap-3 pt-5 mt-auto border-t border-zinc-100">
          <button
            onClick={onClose}
            disabled={savingAll}
            className="px-5 py-2.5 rounded text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60 min-w-[140px] justify-center"
          >
            {savingAll && <Loader2 className="w-4 h-4 animate-spin" />}
            {unsavedCount > 0 ? `Salvar Todos (${unsavedCount})` : 'Concluir'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
