'use client';
import { Combo } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditablePrice } from '@/components/cms/EditablePrice';

interface CombosSectionProps {
  combos: Combo[];
}

export function CombosSection({ combos }: CombosSectionProps) {
  if (combos.length === 0) return null;

  return (
    <section id="combos" className="py-20 bg-zinc-50 border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 font-heading mb-4">
            Combos <span className="text-[var(--color-primary)]">Especiais</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            As melhores combinações pelo melhor preço para você e sua família.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {combos.map((combo) => (
            <Card key={combo.id} className="overflow-hidden flex flex-col group border-2 border-[var(--color-primary)]/10">
              <div className="h-56 relative bg-zinc-100 overflow-hidden flex items-center justify-center">
                <EditableImage
                  src={combo.imagem}
                  table="combos"
                  field="imagem"
                  id={combo.id}
                  bucket="products"
                  className="w-full h-full"
                >
                  <img
                    src={combo.imagem || '/combo-placeholder.png'}
                    alt={combo.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 drop-shadow-xl"
                  />
                </EditableImage>
              </div>
              
              <div className="p-6 bg-white flex flex-col flex-1">
                <h3 className="text-2xl font-black text-zinc-900 mb-2 font-heading">
                  <EditableText text={combo.nome} table="combos" field="nome" id={combo.id} />
                </h3>
                <p className="text-zinc-500 text-sm mb-6 flex-1">
                  <EditableText text={combo.descricao || ''} table="combos" field="descricao" id={combo.id} multiline />
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Apenas</span>
                    <span className="text-2xl font-black text-[var(--color-primary)]">
                      <EditablePrice price={combo.preco} table="combos" field="preco" id={combo.id} />
                    </span>
                  </div>
                  {/* Ideally this would add all items to cart, or redirect to WhatsApp. For now, WhatsApp is simple. */}
                  <a href="#inicio">
                    <Button variant="primary">Pedir Agora</Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
