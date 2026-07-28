'use client';
import { useState } from 'react';
import { Produto, Categoria } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { useCart, useCMSStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditablePrice } from '@/components/cms/EditablePrice';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { adminDelete } from '@/lib/adminDelete';
import { ProdutoModal } from '@/components/ui/ProdutoModal';
import { GaleriaProdutoModal } from '@/components/admin/vitrine/GaleriaProdutoModal';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

interface MenuSectionProps {
  categorias: Categoria[];
  produtos: Produto[];
}

export function MenuSection({ categorias, produtos: initialProdutos }: MenuSectionProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const router = useRouter();
  const [produtos, setProdutos] = useState(initialProdutos);
  const [activeCategory, setActiveCategory] = useState<string>(categorias[0]?.id || '');
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [galleryProdutoId, setGalleryProdutoId] = useState<string | null>(null);

  const selectedCategory = categorias.find((c) => c.id === activeCategory);
  const isBebidas = selectedCategory?.slug === 'bebidas';

  let filteredProducts = produtos.filter((p) => p.categoria_id === activeCategory);
  
  // Extract unique subcategories if we are in Bebidas
  const subs = Array.from(new Set(filteredProducts.map(p => p.subcategoria).filter(Boolean))) as string[];

  if (isBebidas && activeSub) {
    filteredProducts = filteredProducts.filter((p) => p.subcategoria === activeSub);
  }

  const handleAddProduct = async () => {
    if (!activeCategory) return;
    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          categoria_id: activeCategory,
          nome: 'Novo Produto',
          descricao: 'Descrição do novo produto.',
          preco: 15.00,
          ativo: true,
          subcategoria: isBebidas ? activeSub || 'refrigerante' : null,
          ordem: filteredProducts.length
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setProdutos(prev => [...prev, data]);
    } catch (e: any) {
      console.error('Error adding product:', e);
      alert('Erro ao adicionar produto: ' + (e.message || JSON.stringify(e)));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Deseja realmente excluir este produto?')) return;
    
    // Remove from UI immediately for instant feedback
    setProdutos(prev => prev.filter(p => p.id !== id));
    
    try {
      await adminDelete('produtos', id);
    } catch (e: any) {
      console.error('Error deleting product:', e);
      // Restore on error
      setProdutos(initialProdutos);
      alert('Erro ao excluir produto: ' + e.message);
    }
  };

  return (
    <section id="cardapio" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 font-heading mb-4">
            Nosso <span className="text-[var(--color-primary)]">Cardápio</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Feito com ingredientes selecionados para proporcionar a melhor experiência.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSub(null);
              }}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all
                ${activeCategory === cat.id 
                  ? 'bg-[var(--color-primary)] text-white shadow-md scale-105' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}
              `}
            >
              <span className="text-lg">{cat.emoji}</span>
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Subcategory Filter (Bebidas) */}
        {isBebidas && subs.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveSub(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${!activeSub ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-zinc-200 text-zinc-500'}
              `}
            >
              Todos
            </button>
            {subs.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize border
                  ${activeSub === sub ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-zinc-200 text-zinc-500'}
                `}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((produto) => (
              <motion.div
                key={produto.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  onClick={() => !isEditMode && setSelectedProduto(produto)}
                  className={`p-4 flex gap-4 h-full relative ${!isEditMode ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${produto.featured ? 'border-[var(--color-primary)] shadow-md shadow-primary/5' : ''}`}
                >
                  {/* Delete Button for Admin */}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProduct(produto.id, e)}
                      className="absolute top-2 right-2 z-20 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-transform hover:scale-110"
                      title="Excluir Produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Image */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-zinc-50 rounded-lg overflow-hidden relative flex items-center justify-center">
                    {isEditMode ? (
                      <button 
                        onClick={() => setGalleryProdutoId(produto.id)}
                        className="w-full h-full relative group outline-none"
                      >
                        <img
                           src={produto.imagem || '/product-placeholder.jpg'}
                           alt={produto.nome}
                           className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[var(--color-primary)] px-2 py-1 sm:px-3 sm:py-1.5 rounded shadow">Galeria</span>
                        </div>
                      </button>
                    ) : (
                      <img
                         src={produto.imagem || '/product-placeholder.jpg'}
                         alt={produto.nome}
                         className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 pr-6">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-zinc-900 leading-tight">
                        <EditableText text={produto.nome} table="produtos" field="nome" id={produto.id} />
                      </h3>
                      <div className="flex items-center gap-1">
                        {produto.promotion && <Badge variant="promotion" className="shrink-0 px-1.5 py-0">Promo</Badge>}
                        <FavoriteButton produtoId={produto.id} />
                      </div>
                    </div>
                    
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                      <EditableText text={produto.descricao || ''} table="produtos" field="descricao" id={produto.id} multiline />
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-[var(--color-primary)]">
                        <EditablePrice price={produto.preco} table="produtos" field="preco" id={produto.id} />
                      </span>
                      {!isEditMode && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(produto);
                          }}
                        >
                          <ShoppingBag className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Add</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Add Product Card (Admin Only) */}
            {isEditMode && (
              <motion.div layout>
                <Card 
                  onClick={handleAddProduct}
                  className="h-full min-h-[140px] border-2 border-dashed border-zinc-200 hover:border-[var(--color-primary)] hover:bg-zinc-50/50 transition-all flex flex-col items-center justify-center cursor-pointer p-4 gap-2 group/add"
                >
                  <div className="p-2 rounded-full bg-zinc-50 group-hover/add:bg-[var(--color-primary)]/10 transition-colors">
                    <Plus className="w-6 h-6 text-zinc-400 group-hover/add:text-[var(--color-primary)] transition-colors" />
                  </div>
                  <span className="font-bold text-zinc-600 group-hover/add:text-[var(--color-primary)] transition-colors text-xs">
                    {isAdding ? 'Adicionando...' : 'Adicionar Produto'}
                  </span>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && !isEditMode && (
          <div className="text-center py-12 text-zinc-500">
            Nenhum produto encontrado nesta categoria.
          </div>
        )}

      </div>
      
      <ProdutoModal 
        isOpen={!!selectedProduto} 
        onClose={() => setSelectedProduto(null)} 
        produto={selectedProduto} 
      />

      {galleryProdutoId && (
        <GaleriaProdutoModal
          isOpen={!!galleryProdutoId}
          onClose={() => {
            setGalleryProdutoId(null);
            router.refresh();
          }}
          produtoId={galleryProdutoId}
        />
      )}
    </section>
  );
}
