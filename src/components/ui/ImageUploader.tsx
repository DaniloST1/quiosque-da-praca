'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { uploadImage, replaceImage, StorageBucket } from '@/lib/storage';

interface ImageUploaderProps {
  bucket: StorageBucket;
  currentImage?: string | null;
  onUploadSuccess: (url: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function ImageUploader({
  bucket,
  currentImage,
  onUploadSuccess,
  onCancel,
  className = '',
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      alert('Por favor, selecione uma imagem ou um vídeo.');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSave = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = currentImage
        ? await replaceImage(bucket, currentImage, file)
        : await uploadImage(bucket, file);
      
      onUploadSuccess(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar imagem.');
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className={`flex flex-col gap-0 ${className}`} style={{ minHeight: '360px' }}>
      {!file ? (
        /* ── Área de drag-and-drop ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 mx-1 mb-5
            rounded-xl border-2 border-dashed cursor-pointer transition-all
            py-10 px-6 select-none flex-1
            ${dragActive
              ? 'border-[var(--color-primary)] bg-orange-50'
              : 'border-zinc-300 bg-zinc-50 hover:border-[var(--color-primary)] hover:bg-orange-50/50'}
          `}
        >
          <UploadCloud className={`w-10 h-10 transition-colors ${dragActive ? 'text-[var(--color-primary)]' : 'text-zinc-400'}`} />
          <p className="text-sm text-zinc-600 font-medium">
            Clique ou arraste uma imagem ou vídeo
          </p>
          <p className="text-xs text-zinc-400">PNG, JPG, WEBP ou MP4/WebM</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={isUploading}
          />
        </div>
      ) : (
        /* ── Lista de imagens ── */
        <div className="flex-1 overflow-y-auto mx-1">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto] px-3 py-2 bg-zinc-100 rounded-t-lg border border-zinc-200 border-b-0">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Arquivo</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</span>
          </div>

          {/* Linhas */}
          <div className="border border-zinc-200 rounded-b-lg overflow-hidden divide-y divide-zinc-100">
            <div className="grid grid-cols-[1fr_auto] items-center px-3 py-3 transition-colors bg-white hover:bg-zinc-50">
              {/* Thumb + nome */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                  <img
                    src={previewUrl!}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => e.currentTarget.style.display = 'none'}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate max-w-[180px]" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Nova</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Salvar individual */}
                <button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="px-3 py-1 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded transition-colors disabled:opacity-60 flex items-center justify-center min-w-[70px]"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>

                {/* Excluir */}
                <button
                  onClick={handleRemove}
                  disabled={isUploading}
                  title="Excluir"
                  className="px-3 py-1 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>

          {/* Botão Adicionar mais (para substituir a que escolheu) */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2 rounded text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              Adicionar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex justify-end items-center gap-3 pt-5 mt-auto border-t border-zinc-100">
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="px-5 py-2.5 rounded text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isUploading || !file}
          className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60 min-w-[140px] justify-center"
        >
          {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {file ? 'Salvar Todos (1)' : 'Concluir'}
        </button>
      </div>
    </div>
  );
}
