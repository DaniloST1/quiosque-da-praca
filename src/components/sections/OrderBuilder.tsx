'use client';
import { useState } from 'react';
import { Produto } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency, buildWhatsAppMessage } from '@/lib/utils';
import { ChevronRight, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderBuilderProps {
  produtos: Produto[];
  whatsappNumber: string;
}

const STEPS = [
  { id: 'lanche', title: 'Lanche', catSlug: 'lanches' },
  { id: 'porcao', title: 'Porção', catSlug: 'porcoes' },
  { id: 'pastel', title: 'Pastel', catSlug: 'pasteis' },
  { id: 'espetinho', title: 'Espetinho', catSlug: 'espetinhos' },
  { id: 'bebida', title: 'Bebida', catSlug: 'bebidas' }, // Step 5: Bebidas
];

export function OrderBuilder({ produtos, whatsappNumber }: OrderBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, number>>({});

  const step = STEPS[currentStep];
  const stepProducts = produtos.filter(p => p.categoria?.slug === step.catSlug);

  const handleSelect = (produto: Produto) => {
    const qty = selections[produto.id] || 0;
    if (qty === 0) {
      setSelections({ ...selections, [produto.id]: 1 });
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleFinish = () => {
    const items = produtos
      .filter(p => (selections[p.id] || 0) > 0)
      .map(p => ({ nome: p.nome, preco: p.preco, quantidade: selections[p.id] }));
      
    if (items.length === 0) {
      alert('Selecione pelo menos um item!');
      return;
    }
    const total = items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const url = buildWhatsAppMessage(items, total, whatsappNumber);
    window.open(url, '_blank');
  };

  const isStepCompleted = (catSlug: string) => {
    return produtos.some(p => p.categoria?.slug === catSlug && (selections[p.id] || 0) > 0);
  };

  return (
    <section id="montar-pedido" className="py-20 bg-[var(--color-primary)] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black font-heading mb-4">
            Monte seu Pedido Ideal
          </h2>
          <p className="text-white/80">
            Siga o passo a passo e monte uma combinação perfeita.
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 md:p-10 text-white">
          
          {/* Progress */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 hide-scrollbar">
            {STEPS.map((s, idx) => {
              const completed = isStepCompleted(s.catSlug);
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className={`flex flex-col items-center gap-2 px-2 transition-opacity ${
                      idx === currentStep ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors
                      ${completed ? 'bg-green-500 border-green-500 text-white' : 
                        idx === currentStep ? 'border-white text-white' : 'border-white/30 text-white/50'}`}
                    >
                      {completed ? <Check className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span className="text-sm font-semibold">{s.title}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-5 h-5 mx-2 text-white/30" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Options */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-xl font-bold mb-6">
                  Escolha seu {step.title} <span className="text-sm font-normal opacity-70">(Opcional)</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stepProducts.map(produto => {
                    const quantity = selections[produto.id] || 0;
                    return (
                      <div
                        key={produto.id}
                        onClick={() => handleSelect(produto)}
                        className={`rounded-xl p-4 border-2 transition-all flex flex-col gap-2 relative group
                          ${quantity > 0 
                            ? 'border-white bg-white/20 shadow-lg' 
                            : 'border-white/10 hover:border-white/30 bg-black/20 hover:bg-black/30 cursor-pointer'}`}
                      >
                        <span className="font-bold pr-16">{produto.nome}</span>
                        <span className="text-sm opacity-80">{formatCurrency(produto.preco)}</span>
                        
                        {quantity > 0 ? (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center bg-zinc-900/60 rounded-full px-2 py-1 gap-2 border border-white/25">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelections({ ...selections, [produto.id]: quantity - 1 });
                              }}
                              className="w-6 h-6 flex items-center justify-center font-bold text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                              -
                            </button>
                            <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelections({ ...selections, [produto.id]: quantity + 1 });
                              }}
                              className="w-6 h-6 flex items-center justify-center font-bold text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelections({ ...selections, [produto.id]: 1 });
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-lg transition-all"
                          >
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  <div
                    onClick={() => {
                      const newSelections = { ...selections };
                      stepProducts.forEach(p => {
                        delete newSelections[p.id];
                      });
                      setSelections(newSelections);
                    }}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex items-center justify-center min-h-[76px]
                      ${!stepProducts.some(p => (selections[p.id] || 0) > 0)
                        ? 'border-white bg-white/20 shadow-lg' 
                        : 'border-white/10 hover:border-white/30 bg-black/20 hover:bg-black/30'}`}
                  >
                    <span className="font-bold opacity-80">Pular esta etapa</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm opacity-80">Total Parcial</span>
              <span className="text-2xl font-black">
                {formatCurrency(
                  produtos.reduce((sum, p) => sum + (p.preco * (selections[p.id] || 0)), 0)
                )}
              </span>
            </div>
            
            {currentStep < STEPS.length - 1 ? (
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[var(--color-primary)] w-full sm:w-auto border-2"
                onClick={handleNext}
              >
                Próximo Passo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg w-full sm:w-auto border-none"
                onClick={handleFinish}
              >
                Enviar Pedido <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

        </Card>
      </div>
    </section>
  );
}
