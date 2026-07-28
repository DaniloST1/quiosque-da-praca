'use client';
import { useState } from 'react';
import { useCart } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShoppingCart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckoutModal } from '@/components/ui/CheckoutModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

interface CartDrawerProps {
  whatsappNumber: string;
}

export function CartDrawer({ whatsappNumber }: CartDrawerProps) {
  const cart = useCart();
  const { user, openAuthModal } = useAuth();
  const total = cart.total();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [upsells, setUpsells] = useState<any[]>([]);

  useEffect(() => {
    if (!cart.isOpen || cart.items.length === 0) return;
    
    // Pegar o item mais caro para base do upsell
    const itemMaisCaro = [...cart.items].sort((a, b) => b.produto.preco - a.produto.preco)[0];
    
    supabase.from('produtos_relacionados')
      .select('sugerido:produtos!produtos_relacionados_produto_sugerido_id_fkey(*)')
      .eq('produto_base_id', itemMaisCaro.produto.id)
      .limit(2)
      .then(({ data }) => {
        if (data) {
          // Filtrar os que já estão no carrinho
          const inCartIds = cart.items.map(i => i.produto.id);
          const filtered = data.filter(d => {
            const sugerido: any = Array.isArray(d.sugerido) ? d.sugerido[0] : d.sugerido;
            return sugerido && !inCartIds.includes(sugerido.id);
          });
          setUpsells(filtered.map(d => Array.isArray(d.sugerido) ? d.sugerido[0] : d.sugerido));
        }
      });
  }, [cart.isOpen, cart.items]);

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={cart.closeCart}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-zinc-900">Meu Carrinho</h2>
                {cart.items.length > 0 && (
                  <span className="text-xs font-bold bg-[var(--color-primary)] text-white rounded-full px-2 py-0.5">
                    {cart.items.reduce((s, i) => s + i.quantidade, 0)}
                  </span>
                )}
              </div>
              <button
                id="btn-cart-close"
                onClick={cart.closeCart}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
              <AnimatePresence initial={false}>
                {cart.items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full py-16 text-center"
                  >
                    <ShoppingCart className="w-16 h-16 text-zinc-200 mb-4" />
                    <p className="text-zinc-500 font-medium">Seu carrinho está vazio</p>
                    <p className="text-zinc-400 text-sm mt-1">Adicione itens do cardápio!</p>
                    <button
                      onClick={() => {
                        cart.closeCart();
                        const el = document.getElementById('cardapio');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-6 text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      Ver Cardápio →
                    </button>
                  </motion.div>
                ) : (
                  cart.items.map((item) => (
                    <motion.div
                      key={item.instanceId}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 bg-zinc-50 rounded-xl p-3"
                    >
                      {/* Thumb */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-200 shrink-0">
                        {item.produto.imagem ? (
                          <img
                            src={item.produto.imagem}
                            alt={item.produto.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 text-sm truncate">
                          {item.produto.nome}
                        </p>
                        {/* Removidos */}
                        {item.removidos && item.removidos.length > 0 && (
                          <p className="text-xs text-red-500 mt-0.5 font-medium">
                            Sem: {item.removidos.map(r => r.nome).join(', ')}
                          </p>
                        )}
                        {/* Adicionais */}
                        {item.adicionais && item.adicionais.length > 0 && (
                          <p className="text-xs text-green-600 mt-0.5 font-medium">
                            + {item.adicionais.map(a => a.nome).join(', ')}
                          </p>
                        )}
                        <p className="text-[var(--color-primary)] font-bold text-sm mt-1">
                          {formatCurrency((Number(item.produto.preco) + (item.adicionais || []).reduce((sum, a) => sum + Number(a.preco), 0)) * item.quantidade)}
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => cart.updateQuantity(item.instanceId, item.quantidade - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-200 hover:bg-zinc-300 transition-colors text-zinc-700"
                          aria-label="Remover um"
                        >
                          {item.quantidade === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-zinc-900">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.instanceId, item.quantidade + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors text-white"
                          aria-label="Adicionar um"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Upsell */}
            {upsells.length > 0 && (
              <div className="px-6 py-4 bg-orange-50 border-t border-orange-100">
                <p className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Você também pode gostar
                </p>
                <div className="space-y-2">
                  {upsells.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-orange-100/50">
                      <div className="flex items-center gap-2">
                        {u.imagem && <img src={u.imagem} alt="" className="w-8 h-8 rounded-md object-cover bg-zinc-100" />}
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{u.nome}</p>
                          <p className="text-xs font-bold text-[var(--color-primary)]">{formatCurrency(u.preco)}</p>
                        </div>
                      </div>
                      <button onClick={() => cart.addItem(u)} className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-zinc-100 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Total</span>
                  <span className="text-2xl font-black text-zinc-900">{formatCurrency(total)}</span>
                </div>

                <button
                  id="btn-cart-finalize"
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                    } else {
                      setIsCheckoutOpen(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-600/20 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Finalizar Pedido
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={cart.clearCart}
                  className="w-full text-xs text-zinc-400 hover:text-red-500 transition-colors py-1"
                >
                  Limpar carrinho
                </button>
              </div>
            )}
          </motion.aside>

          <CheckoutModal 
            isOpen={isCheckoutOpen} 
            onClose={() => setIsCheckoutOpen(false)} 
            whatsappNumber={whatsappNumber} 
          />
        </>
      )}
    </AnimatePresence>
  );
}
