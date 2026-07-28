'use client';
import { useState } from 'react';
import { Avaliacao } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Star, Quote } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { Button } from '@/components/ui/Button';

interface ReviewsSectionProps {
  avaliacoes: Avaliacao[];
}

export function ReviewsSection({ avaliacoes }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (avaliacoes.length === 0) return null;

  const averageRating = (avaliacoes.reduce((acc, cur) => acc + cur.nota, 0) / avaliacoes.length).toFixed(1);

  const displayedReviews = showAll ? avaliacoes : avaliacoes.slice(0, 9);

  return (
    <section id="avaliacoes" className="py-20 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-12">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 font-heading mb-4">
              O que dizem nossos <span className="text-[var(--color-primary)]">Clientes</span>
            </h2>
            <p className="text-zinc-600 max-w-xl">
              Sua satisfação é o nosso maior objetivo. Veja as experiências de quem já provou.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-6 shrink-0">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[var(--color-accent)] mb-1">
                <Star className="w-6 h-6 fill-current" />
                <span className="text-3xl font-black text-zinc-900">{averageRating}</span>
                <span className="text-xl font-bold text-zinc-400">/5</span>
              </div>
            </div>
            <div className="w-px h-12 bg-zinc-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900">+250</span>
              <span className="text-sm font-semibold text-zinc-500 leading-tight">Clientes<br/>Atendidos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReviews.map((review) => (
            <Card key={review.id} className="p-6 flex flex-col h-full bg-white relative">
              <Quote className="absolute top-6 right-6 w-8 h-8 text-[var(--color-primary)] opacity-10" />
              
              <div className="flex items-center gap-1 mb-4 text-[var(--color-accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.nota ? 'fill-current' : 'text-zinc-300'}`} />
                ))}
              </div>
              
              <p className="text-zinc-600 text-sm leading-relaxed mb-6 flex-1 italic">
                &quot;<EditableText text={review.texto} table="avaliacoes" field="texto" id={review.id} multiline />&quot;
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg uppercase">
                  {review.nome.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-900 text-sm">
                    <EditableText text={review.nome} table="avaliacoes" field="nome" id={review.id} />
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">Cliente Verificado</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {avaliacoes.length > 9 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="border-zinc-300 hover:bg-zinc-50 font-bold px-8 py-3"
            >
              {showAll ? 'Ver Menos' : 'Ver Mais'}
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}
