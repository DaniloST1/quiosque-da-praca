'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Banner } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { useCMSStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface HeroSectionProps {
  banners: Banner[];
  whatsappUrl?: string;
  whatsappNumber?: string;
  ifoodUrl?: string;
  link_whatsapp_direto?: boolean;
}

export function HeroSection({ banners, whatsappUrl, whatsappNumber, ifoodUrl, link_whatsapp_direto = false }: HeroSectionProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalType, setModalType] = useState<'desktop' | 'mobile' | null>(null);

  const updateMediaType = async (type: string, id: string) => {
    try {
      await supabase.from('banners').update({ media_tipo: type }).eq('id', id);
      router.refresh();
    } catch(e) {}
  };

  const handleUploadSuccess = async (url: string) => {
    if (!modalType || !banners[currentIndex]) return;
    const currentId = banners[currentIndex].id;
    try {
      const field = modalType === 'desktop' ? 'media_url_desktop' : 'media_url_mobile';
      const isVid = isVideo(url);
      
      const payload: any = { [field]: url };
      if (modalType === 'desktop') payload.imagem = url;
      if (isVid) payload.media_tipo = 'video';
      
      await supabase.from('banners').update(payload).eq('id', currentId);
      router.refresh();
      setModalType(null);
    } catch (e) {
      alert('Erro ao atualizar banner');
    }
  };

  // Auto-slide if multiple banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners.length) return null;
  const current = banners[currentIndex];

  const isVideo = (url: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext) || url.toLowerCase().endsWith(ext));
  };

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right'
  };

  const currentAlign = ((current as any).alinhamento_texto as 'left' | 'center' | 'right') || 'center';
  const alignClass = alignmentClasses[currentAlign] || 'items-center text-center';

  return (
    <section id="inicio" className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-zinc-900 pt-20">
      
      {/* Background Image/Video Slider */}
      {/* Background Image/Video Slider */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0"
        >
          {isEditMode && (
            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
              <div className="bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg p-3 flex flex-col gap-3 shadow-xl pointer-events-auto">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Mídia do Fundo</span>
                  <a href="/admin/vitrine/banners" className="text-[10px] text-zinc-400 hover:text-white underline">Avançado</a>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setModalType('desktop')}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                  >
                    Desktop
                  </button>
                  <button 
                    onClick={() => setModalType('mobile')}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                  >
                    Mobile
                  </button>
                </div>
                
                <div className="flex items-center justify-between border-t border-zinc-700 pt-3">
                  <span className="text-[10px] text-zinc-400 font-medium">Exibição Atual:</span>
                  <div className="flex bg-zinc-900 rounded p-1">
                    <button 
                      onClick={() => updateMediaType('imagem', current.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${current.media_tipo === 'imagem' || !current.media_tipo ? 'bg-[var(--color-primary)] text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      IMG
                    </button>
                    <button 
                      onClick={() => updateMediaType('video', current.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${current.media_tipo === 'video' ? 'bg-[var(--color-primary)] text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      VÍDEO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Media */}
          <div className="block md:hidden w-full h-full">
            {current.media_tipo === 'video' ? (
              <video src={current.media_url_mobile || current.imagem || ''} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${current.media_url_mobile || current.imagem || '/hero-placeholder.jpg'})` }} />
            )}
          </div>

          {/* Desktop Media */}
          <div className="hidden md:block w-full h-full">
            {current.media_tipo === 'video' ? (
              <video src={current.media_url_desktop || current.imagem || ''} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${current.media_url_desktop || current.imagem || '/hero-placeholder.jpg'})` }} />
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col ${alignClass}`}>
        
        {/* Alignment Controls for Admin */}
        {isEditMode && (
          <div className="mb-6 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-lg p-2 flex items-center gap-2 shadow-xl z-20">
            <span className="text-xs text-zinc-400 font-semibold px-2">Alinhamento do Texto:</span>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('banners')
                      .update({ alinhamento_texto: align })
                      .eq('id', current.id);
                    if (error) throw error;
                    router.refresh();
                  } catch (e) {
                    console.error('Error updating banner alignment:', e);
                  }
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  currentAlign === align
                    ? 'bg-[var(--color-primary)] text-white shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
              </button>
            ))}
          </div>
        )}

        <motion.div
          key={`content-${current.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-3xl space-y-6"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white font-heading tracking-tight drop-shadow-lg leading-none">
            <EditableText 
              text={current.titulo}
              table="banners"
              field="titulo"
              id={current.id}
            />
          </h1>
          
          {current.subtitulo && (
            <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium font-heading drop-shadow-md">
              <EditableText 
                text={current.subtitulo}
                table="banners"
                field="subtitulo"
                id={current.id}
              />
            </p>
          )}

          {current.descricao && (
            <p className={`text-base md:text-lg text-zinc-300 max-w-2xl ${
              currentAlign === 'center' ? 'mx-auto' : currentAlign === 'right' ? 'ml-auto' : 'mr-auto'
            }`}>
              <EditableText 
                text={current.descricao}
                table="banners"
                field="descricao"
                id={current.id}
                multiline
              />
            </p>
          )}

          <div className={`pt-8 flex flex-col sm:flex-row items-center gap-4 ${
            currentAlign === 'center' ? 'justify-center' : currentAlign === 'right' ? 'justify-end' : 'justify-start'
          }`}>
            {current.botao_principal_texto && (
              <a href={current.botao_principal_link || '#cardapio'}>
                <Button size="lg" className="w-full sm:w-auto text-lg px-10">
                  <EditableText text={current.botao_principal_texto} table="banners" field="botao_principal_texto" id={current.id} />
                </Button>
              </a>
            )}
            
            {current.botao_secundario_texto && whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg bg-green-600 hover:bg-green-700">
                  <EditableText text={current.botao_secundario_texto} table="banners" field="botao_secundario_texto" id={current.id} />
                </Button>
              </a>
            )}

            {current.botao_terciario_texto && ifoodUrl && (
              <a href={ifoodUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg border-white text-white hover:bg-white hover:text-black">
                  <EditableText text={current.botao_terciario_texto} table="banners" field="botao_terciario_texto" id={current.id} />
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-[var(--color-primary)] w-8' : 'bg-white/50 hover:bg-white'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
      {/* Modal de Edição de Mídia */}
      {isEditMode && (
        <Modal 
          isOpen={modalType !== null} 
          onClose={() => setModalType(null)}
          title={`Alterar Mídia ${modalType === 'desktop' ? 'Desktop' : 'Mobile'}`}
        >
          <ImageUploader 
            bucket="banners"
            currentImage={modalType === 'desktop' ? current.media_url_desktop : current.media_url_mobile}
            onUploadSuccess={handleUploadSuccess}
          />
        </Modal>
      )}
    </section>
  );
}
