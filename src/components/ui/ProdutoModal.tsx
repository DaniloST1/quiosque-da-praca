'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Star, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store';
import { Produto } from '@/types/database';

interface ProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
}

export function ProdutoModal({ isOpen, onClose, produto }: ProdutoModalProps) {
  const { addItem } = useCart();
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [upsell, setUpsell] = useState<any[]>([]);
  const [adicionaisDisponiveis, setAdicionaisDisponiveis] = useState<any[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    if (isOpen && produto) {
      setLoading(true);
      setCurrentImageIdx(0); // Reset index when opening a new product
      setRemovidos([]);
      setAdicionaisSelecionados([]);
      Promise.all([
        supabase.from('ficha_tecnica').select('item_id, quantidade, removivel, destaque, item:estoque_itens(nome)').eq('produto_id', produto.id),
        supabase.from('produtos_relacionados').select('sugerido:produtos!produtos_relacionados_produto_sugerido_id_fkey(*)').eq('produto_base_id', produto.id),
        supabase.from('produto_adicionais').select('*').eq('produto_id', produto.id).eq('ativo', true),
        supabase.from('produto_avaliacoes').select('nota, comentario, created_at, pedido:pedidos(cliente_nome)').eq('produto_id', produto.id).order('created_at', { ascending: false }).limit(3)
      ]).then(([resFicha, resUpsell, resAdic, resAval]) => {
        if (resFicha.data) setIngredientes(resFicha.data);
        if (resUpsell.data) setUpsell(resUpsell.data.map((d:any) => d.sugerido));
        if (resAdic.data) setAdicionaisDisponiveis(resAdic.data);
        if (resAval.data) setAvaliacoes(resAval.data);
      }).finally(() => setLoading(false));
    }
  }, [isOpen, produto]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !produto) return null;

  const rating = typeof (produto as any).avaliacao_media === 'number' ? (produto as any).avaliacao_media : 0;
  const totalAvaliacoes = (produto as any).total_avaliacoes || 0;

  const handleAddMain = () => {
    const r = removidos.map(id => {
      const ing = ingredientes.find(i => i.item_id === id);
      return { id, nome: ing?.item?.nome };
    }).filter(Boolean);
    
    const a = adicionaisSelecionados.map(id => {
      const ad = adicionaisDisponiveis.find(i => i.id === id);
      return { id, nome: ad?.nome, preco: ad?.preco };
    }).filter(Boolean);
    
    addItem(produto, r as any, a as any);
    onClose();
  };
  const handleAddUpsell = (p: Produto) => addItem(p);

  // Combine main image with gallery images
  const todasImagens = [];
  
  if (produto.imagens && produto.imagens.length > 0) {
    // If we have images from the new table, use them: favorita first, then ordem ASC
    const sortedImages = [...produto.imagens].sort((a, b) => {
      if (a.favorita && !b.favorita) return -1;
      if (!a.favorita && b.favorita) return 1;
      return (a.ordem ?? 0) - (b.ordem ?? 0);
    });
    todasImagens.push(...sortedImages.map(img => img.imagem_url));
  } else {
    // Fallback for older products or backward compatibility
    if (produto.imagem) todasImagens.push(produto.imagem);
    if ((produto as any).galeria && Array.isArray((produto as any).galeria)) {
      todasImagens.push(...(produto as any).galeria);
    }
  }

  if (todasImagens.length === 0) todasImagens.push('/product-placeholder.jpg');

  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % todasImagens.length);
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + todasImagens.length) % todasImagens.length);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: '860px', maxHeight: '85vh' }}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 bg-white text-zinc-400 hover:text-zinc-700 border border-zinc-200 hover:bg-zinc-50 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row h-full" style={{ minHeight: '460px', maxHeight: '85vh' }}>

          {/* ═══════════ COLUNA ESQUERDA — FOTO (CARROSSEL) ═══════════ */}
          <div className="w-full md:w-1/2 shrink-0 bg-zinc-100 overflow-hidden relative h-64 md:h-auto group">
            <img
              src={todasImagens[currentImageIdx]}
              alt={produto.nome}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ minHeight: '100%', maxHeight: '85vh' }}
            />
            
            {/* Controles do Carrossel */}
            {todasImagens.length > 1 && (
              <>
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 z-10">
                  {todasImagens.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`h-2 rounded-full transition-all ${idx === currentImageIdx ? 'w-4 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>

          {/* ═══════════ COLUNA DIREITA — INFOS ═══════════ */}
          <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
            {/* Área rolável */}
            <div className="flex-1 overflow-y-auto p-8 pr-12 pb-4 space-y-0">
              
              {/* Nome */}
              <h2 className="text-2xl font-black text-zinc-900 leading-tight">
                {produto.nome}
              </h2>

              {/* Estrelas */}
              <div className="flex items-center gap-1 mt-2">
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`}
                  />
                ))}
                {totalAvaliacoes > 0 && (
                  <span className="text-zinc-400 text-xs ml-1">({totalAvaliacoes})</span>
                )}
              </div>

              {/* Preço */}
              <p className="text-3xl font-black text-[var(--color-primary)] mt-5">
                {formatCurrency(Number(produto.preco) + adicionaisSelecionados.reduce((sum, id) => {
                  const ad = adicionaisDisponiveis.find(a => a.id === id);
                  return sum + (ad ? Number(ad.preco) : 0);
                }, 0))}
              </p>

              {/* Ingredientes / Descrição / Personalização */}
              <div className="pt-8">
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-3 bg-zinc-100 animate-pulse rounded w-3/4" />)}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-zinc-800 mb-2">Ingredientes:</p>
                    {ingredientes.length > 0 ? (
                      <ul className="text-sm text-zinc-500 space-y-1 mb-4">
                        {ingredientes.map((ing, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[var(--color-primary)] font-bold leading-none mt-0.5">•</span>
                            {ing.item?.nome}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-zinc-400 italic leading-relaxed space-y-1 mb-4">
                        {produto.descricao && <p>{produto.descricao}</p>}
                        {(produto as any).descricao_completa && (
                          <p className="whitespace-pre-line">{(produto as any).descricao_completa}</p>
                        )}
                        {!produto.descricao && !(produto as any).descricao_completa && (
                          <p>Ingredientes não cadastrados.</p>
                        )}
                      </div>
                    )}

                    {/* Remoções */}
                    {ingredientes.filter(i => i.removivel && i.destaque).length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-bold text-zinc-800 mb-3">Remover ingredientes:</p>
                        <div className="space-y-2">
                          {ingredientes.filter(i => i.removivel && i.destaque).map(ing => (
                            <label key={ing.item_id} className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={!removidos.includes(ing.item_id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setRemovidos(prev => prev.filter(id => id !== ing.item_id));
                                    else setRemovidos(prev => [...prev, ing.item_id]);
                                  }}
                                />
                                <div className="w-5 h-5 border-2 border-zinc-300 rounded transition-colors peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] group-hover:border-[var(--color-primary)]"></div>
                                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none"><path d="M1 7L5 11L13 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                              <span className="text-sm text-zinc-700">{ing.item?.nome}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adicionais */}
                    {adicionaisDisponiveis.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-bold text-zinc-800 mb-3">Adicionar extras:</p>
                        <div className="space-y-2">
                          {adicionaisDisponiveis.map(adic => (
                            <label key={adic.id} className="flex items-center justify-between cursor-pointer group p-2 -mx-2 hover:bg-zinc-50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={adicionaisSelecionados.includes(adic.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setAdicionaisSelecionados(prev => [...prev, adic.id]);
                                      else setAdicionaisSelecionados(prev => prev.filter(id => id !== adic.id));
                                    }}
                                  />
                                  <div className="w-5 h-5 border-2 border-zinc-300 rounded transition-colors peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] group-hover:border-[var(--color-primary)]"></div>
                                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none"><path d="M1 7L5 11L13 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <span className="text-sm text-zinc-700">{adic.nome}</span>
                              </div>
                              <span className="text-sm font-bold text-[var(--color-primary)]">
                                + {formatCurrency(adic.preco)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Avaliações Recentes */}
                    {avaliacoes.length > 0 && (
                      <div className="mt-8 border-t border-zinc-100 pt-6">
                        <p className="text-sm font-bold text-zinc-800 mb-4">Avaliações dos Clientes:</p>
                        <div className="space-y-4">
                          {avaliacoes.map((av, idx) => (
                            <div key={idx} className="bg-zinc-50 p-4 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5].map(i => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i <= av.nota ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                                  ))}
                                </div>
                                <span className="text-xs font-semibold text-zinc-500">{av.pedido?.cliente_nome || 'Cliente'}</span>
                              </div>
                              {av.comentario && <p className="text-sm text-zinc-600 italic">"{av.comentario}"</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Upsell */}
              {upsell.length > 0 && !loading && (
                <div className="pt-6">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
                    Clientes também pediram:
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {upsell.map(u => (
                      <div key={u.id} className="shrink-0 w-24 text-center group cursor-pointer" onClick={() => handleAddUpsell(u)}>
                        <img
                          src={u.imagem || '/product-placeholder.jpg'}
                          alt={u.nome}
                          className="w-20 h-20 object-cover rounded-xl bg-zinc-100 mx-auto transition-transform group-hover:scale-105"
                        />
                        <p className="text-xs font-semibold text-zinc-700 mt-2 line-clamp-1">{u.nome}</p>
                        <p className="text-xs font-bold text-[var(--color-primary)]">
                          + {formatCurrency(u.preco)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botão — fixo no rodapé */}
            <div className="px-8 py-6 shrink-0">
              <div className="flex justify-end">
                <Button
                  className="px-8 h-12 text-base font-bold rounded-xl shadow-md"
                  onClick={handleAddMain}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Adicionar ao Pedido
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
