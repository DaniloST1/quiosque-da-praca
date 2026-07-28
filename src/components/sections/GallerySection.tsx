'use client';
import { useState } from 'react';
import { GaleriaItem } from '@/types/database';
import { Lightbox } from '@/components/ui/Lightbox';
import { EditableImage } from '@/components/cms/EditableImage';

interface GallerySectionProps {
  items: GaleriaItem[];
}

const CATEGORIES = [
  { id: 'geral', label: 'Todos' },
  { id: 'lanches', label: 'Lanches' },
  { id: 'porcoes', label: 'Porções' },
  { id: 'pasteis', label: 'Pastéis' },
  { id: 'espetinhos', label: 'Espetinhos' },
  { id: 'ambiente', label: 'Ambiente' },
];

export function GallerySection({ items }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState('geral');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const filtered = activeCategory === 'geral' 
    ? items 
    : items.filter(i => i.categoria === activeCategory);

  return (
    <section id="galeria" className="py-20 bg-zinc-900 text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black font-heading mb-4">
            Nossa <span className="text-[var(--color-primary)]">Galeria</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Dê uma olhada no que preparamos para você e nosso ambiente.
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'geral' ? items.length : items.filter(i => i.categoria === cat.id).length;
            if (count === 0 && cat.id !== 'geral') return null; // Hide empty categories
            
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all
                  ${activeCategory === cat.id 
                    ? 'bg-[var(--color-primary)] text-white shadow-md' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}
                `}
              >
                {cat.label} <span className="opacity-50 text-xs ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, index) => (
            <div 
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800 cursor-pointer group"
              onClick={() => setLightboxIndex(index)}
            >
              <EditableImage
                src={item.url}
                table="galeria"
                field="url"
                id={item.id}
                bucket="gallery"
                className="w-full h-full"
              >
                <img
                  src={item.url}
                  alt={item.titulo || 'Galeria'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </EditableImage>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white/90">
                <span className="font-semibold">{item.titulo || 'Ver Ampliada'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Lightbox 
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        initialIndex={lightboxIndex ?? 0}
        images={filtered}
      />
    </section>
  );
}
