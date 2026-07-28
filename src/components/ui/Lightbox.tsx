'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LightboxProps {
  images: { id: string; url: string; titulo?: string | null }[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, isOpen, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  // Update index asynchronously to avoid React's synchronous setState in effect warning
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIndex(initialIndex), 0);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, index]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md">
      {/* Close */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10 bg-black/20 p-2 rounded-full"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 bg-black/20 p-4 rounded-full"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 bg-black/20 p-4 rounded-full"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center p-4"
          onClick={onClose}
        >
          <img 
            src={images[index].url} 
            alt={images[index].titulo || 'Imagem da galeria'}
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {images[index].titulo && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-6 py-2 rounded-full">
              {images[index].titulo}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
