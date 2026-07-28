'use client';
import { useState, useRef, useEffect } from 'react';
import { Promocao } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { useCMSStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { adminDelete } from '@/lib/adminDelete';

interface PromotionsSectionProps {
  promocoes: Promocao[];
}

export function PromotionsSection({ promocoes: initialPromocoes }: PromotionsSectionProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [promocoes, setPromocoes] = useState(initialPromocoes);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const hasOverflow = scrollWidth > clientWidth + 5;
        setCanScrollLeft(hasOverflow && scrollLeft > 5);
        setCanScrollRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [promocoes, isEditMode]);

  if (promocoes.length === 0 && !isEditMode) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const cardWidth = 360; // Approximate card width + gap
      const scrollTo = direction === 'left' 
        ? scrollLeft - cardWidth
        : scrollLeft + cardWidth;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleAddPromotion = async () => {
    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('promocoes')
        .insert({
          titulo: 'Nova Promoção',
          descricao: 'Insira a descrição da promoção aqui.',
          dia_semana: 'Válido toda Quarta',
          desconto_pct: 10,
          ativa: true,
          ordem: promocoes.length,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setPromocoes(prev => [...prev, data]);
    } catch (err: any) {
      console.error('Error adding promotion:', err);
      alert('Erro ao adicionar promoção: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePromotion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!confirm('Deseja realmente excluir esta promoção?')) return;
    
    // Remove from UI immediately for instant feedback
    setPromocoes(prev => prev.filter(p => p.id !== id));
    
    try {
      await adminDelete('promocoes', id);
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
      // Restore on error
      setPromocoes(initialPromocoes);
      alert('Erro ao excluir promoção: ' + err.message);
    }
  };

  const handlePriceChange = async (
    promo: Promocao, 
    field: 'preco_original' | 'preco_desconto', 
    valueStr: string
  ) => {
    const value = valueStr === '' ? null : parseFloat(valueStr);
    
    if (value !== null && (isNaN(value) || value < 0)) return;

    // Get current values
    const p = promo as any;
    const orig = field === 'preco_original' ? value : (p.preco_original ? Number(p.preco_original) : null);
    const desc = field === 'preco_desconto' ? value : (p.preco_desconto ? Number(p.preco_desconto) : null);

    // Calculate discount percent
    let pct: number | null = null;
    if (orig && desc && orig > 0 && desc > 0 && orig > desc) {
      pct = Math.round(((orig - desc) / orig) * 100);
    }

    try {
      const { error } = await supabase
        .from('promocoes')
        .update({
          [field]: value,
          desconto_pct: pct
        })
        .eq('id', promo.id);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      console.error('Error updating promotion price:', err);
      alert('Erro ao atualizar preços: ' + (err.message || JSON.stringify(err)));
    }
  };

  const totalItems = promocoes.length + (isEditMode ? 1 : 0);
  const isCarousel = totalItems >= 4;

  return (
    <section id="promocoes" className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 font-heading mb-4">
            Promoções da <span className="text-[var(--color-primary)]">Semana</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Aproveite nossos descontos especiais e combos imperdíveis.
          </p>
        </div>

        {/* Carousel / Centered Grid Container */}
        <div className="relative group/carousel px-4">
          
          {/* Navigation Arrows: ONLY rendered when carousel is active (totalItems >= 4) */}
          {isCarousel && (
            <>
              {canScrollLeft && (
                <button 
                  onClick={() => handleScroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-30 bg-white hover:bg-zinc-50 text-zinc-800 p-2.5 rounded-full shadow-lg border border-zinc-200 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center"
                  aria-label="Promoções anteriores"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {canScrollRight && (
                <button 
                  onClick={() => handleScroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-30 bg-white hover:bg-zinc-50 text-zinc-800 p-2.5 rounded-full shadow-lg border border-zinc-200 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center"
                  aria-label="Próximas promoções"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          {/* Track: Centered grid when <= 3 items, Scrollable track when >= 4 items */}
          <div 
            ref={scrollRef}
            className={
              isCarousel
                ? "flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 custom-scrollbar justify-start"
                : "flex flex-wrap md:flex-nowrap justify-center items-stretch gap-6 max-w-6xl mx-auto"
            }
          >
            {promocoes.map((promo: any) => {
              // Calculate discount pct in runtime for preview, otherwise use DB field
              const calculatedPct = promo.preco_original && promo.preco_desconto && Number(promo.preco_original) > 0
                ? Math.round(((Number(promo.preco_original) - Number(promo.preco_desconto)) / Number(promo.preco_original)) * 100)
                : promo.desconto_pct;

              return (
                <div 
                  key={promo.id} 
                  className={
                    isCarousel
                      ? "flex-shrink-0 w-[85vw] sm:w-[340px] md:w-[360px] snap-start"
                      : "w-full sm:w-[340px] md:w-[360px] flex-shrink-0"
                  }
                >
                  <Card className="overflow-hidden flex flex-col h-full group relative border border-zinc-100 hover:shadow-md transition-shadow">
                    
                    {/* Delete Button for Admin */}
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={(e) => handleDeletePromotion(promo.id, e)}
                        className="absolute top-3 left-3 z-30 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Excluir Promoção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="relative h-48 sm:h-56 overflow-hidden bg-zinc-50">
                      <EditableImage
                        src={promo.imagem}
                        table="promocoes"
                        field="imagem"
                        id={promo.id}
                        bucket="products"
                        className="w-full h-full"
                      >
                        <img
                          src={promo.imagem || '/promo-placeholder.jpg'}
                          alt={promo.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </EditableImage>
                      {calculatedPct && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg z-10">
                          -{calculatedPct}%
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1 bg-white">
                      <h3 className="text-xl font-bold text-zinc-900 mb-2 font-heading">
                        <EditableText text={promo.titulo} table="promocoes" field="titulo" id={promo.id} />
                      </h3>
                      <p className="text-zinc-500 text-sm mb-4 flex-1">
                        <EditableText text={promo.descricao || ''} table="promocoes" field="descricao" id={promo.id} multiline />
                      </p>
                      
                      {/* Price Area */}
                      {isEditMode ? (
                        <div className="mt-3 pt-3 border-t border-zinc-100 space-y-2">
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Preço Original (R$):</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="ex: 35.00"
                              defaultValue={promo.preco_original ? Number(promo.preco_original) : ''}
                              onBlur={(e) => handlePriceChange(promo, 'preco_original', e.target.value)}
                              className="w-24 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 outline-none focus:border-[var(--color-primary)] text-right font-semibold"
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Preço c/ Desconto (R$):</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="ex: 25.00"
                              defaultValue={promo.preco_desconto ? Number(promo.preco_desconto) : ''}
                              onBlur={(e) => handlePriceChange(promo, 'preco_desconto', e.target.value)}
                              className="w-24 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 outline-none focus:border-[var(--color-primary)] text-right font-semibold text-[var(--color-primary)]"
                            />
                          </div>
                        </div>
                      ) : (
                        promo.preco_original && promo.preco_desconto && (
                          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-baseline gap-2">
                            <span className="text-xs text-zinc-400 line-through">
                              {formatCurrency(Number(promo.preco_original))}
                            </span>
                            <span className="text-base font-black text-[var(--color-primary)]">
                              {formatCurrency(Number(promo.preco_desconto))}
                            </span>
                          </div>
                        )
                      )}

                      {(promo.dia_semana || isEditMode) && (
                        <div className="mt-4 inline-flex items-center text-xs font-bold text-[var(--color-primary)] bg-[var(--color-bg)] px-3 py-1 rounded-md self-start border border-[var(--color-primary)]/20">
                          <EditableText 
                            text={promo.dia_semana || 'Válido toda Quarta'} 
                            table="promocoes" 
                            field="dia_semana" 
                            id={promo.id} 
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}

            {/* Add Promotion Card (Admin Only) */}
            {isEditMode && (
              <div className="flex-shrink-0 w-[85vw] sm:w-[340px] md:w-[360px] snap-start">
                <Card 
                  onClick={handleAddPromotion}
                  className="h-full min-h-[350px] border-2 border-dashed border-zinc-200 hover:border-[var(--color-primary)] hover:bg-zinc-50/50 transition-all flex flex-col items-center justify-center cursor-pointer p-6 gap-3 group/add"
                >
                  <div className="p-4 rounded-full bg-zinc-50 group-hover/add:bg-[var(--color-primary)]/10 transition-colors">
                    <Plus className="w-8 h-8 text-zinc-400 group-hover/add:text-[var(--color-primary)] transition-colors" />
                  </div>
                  <span className="font-bold text-zinc-600 group-hover/add:text-[var(--color-primary)] transition-colors text-sm">
                    {isAdding ? 'Adicionando...' : 'Adicionar Promoção'}
                  </span>
                </Card>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}
