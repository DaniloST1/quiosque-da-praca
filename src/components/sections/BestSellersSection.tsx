'use client';
import { useState } from 'react';
import { Produto } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useCart, useCMSStore } from '@/lib/store';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { ShoppingBag } from 'lucide-react';
import { ProdutoModal } from '@/components/ui/ProdutoModal';

interface BestSellersSectionProps {
  bestSellers: Produto[];
}

export function BestSellersSection({ bestSellers }: BestSellersSectionProps) {
  const { addItem } = useCart();
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  if (bestSellers.length === 0) return null;

  return (
    <section id="mais-pedidos" className="py-20 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 font-heading mb-4">
            Os Mais <span className="text-[var(--color-primary)]">Pedidos</span>
          </h2>
          <p className="text-zinc-600 max-w-2xl mx-auto">
            Os queridinhos dos nossos clientes. Prove e descubra por quê!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bestSellers.map((produto) => (
            <Card 
              key={produto.id} 
              onClick={() => !isEditMode && setSelectedProduto(produto)}
              className={`group border-[var(--color-primary)]/20 shadow-lg shadow-[var(--color-primary)]/5 relative overflow-visible mt-8 md:mt-0 ${!isEditMode ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
            >
              
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                <Badge variant="best_seller" className="text-sm shadow-md py-1 px-4">
                  Mais Pedido
                </Badge>
              </div>

              <div className="p-6 pt-10 flex flex-col h-full">
                <div className="h-48 mb-6 rounded-xl overflow-hidden bg-white shadow-inner relative flex items-center justify-center">
                  <EditableImage
                    src={produto.imagem}
                    table="produtos"
                    field="imagem"
                    id={produto.id}
                    bucket="products"
                    className="w-full h-full"
                  >
                    <img
                      src={produto.imagem || '/product-placeholder.jpg'}
                      alt={produto.nome}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                    />
                  </EditableImage>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-900 mb-2 font-heading">
                  <EditableText text={produto.nome} table="produtos" field="nome" id={produto.id} />
                </h3>
                
                <p className="text-zinc-500 text-sm mb-6 flex-1">
                  <EditableText text={produto.descricao || ''} table="produtos" field="descricao" id={produto.id} multiline />
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                  <span className="text-xl font-black text-[var(--color-primary)]">
                    {formatCurrency(produto.preco)}
                  </span>
                  {!isEditMode && (
                    <Button 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(produto);
                      }}
                      className="shadow-md shadow-primary/20"
                      aria-label="Adicionar ao pedido"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>

      <ProdutoModal 
        isOpen={!!selectedProduto} 
        onClose={() => setSelectedProduto(null)} 
        produto={selectedProduto} 
      />
    </section>
  );
}
