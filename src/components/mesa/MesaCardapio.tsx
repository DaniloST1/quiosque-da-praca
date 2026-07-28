'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { createPedido } from '@/app/actions/pedido';
import { ShoppingBag, Plus, Minus, Check, ChefHat, Trash2, X } from 'lucide-react';

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem?: string | null;
  quantidade: number;
}

interface MesaCardapioProps {
  mesa: { id: string; numero: number; status: string };
  categorias: any[];
  produtos: any[];
  combos: any[];
  config: any;
}

type Tela = 'cardapio' | 'carrinho' | 'pedido_confirmado';

export function MesaCardapio({ mesa, categorias, produtos, combos, config }: MesaCardapioProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0]?.slug || 'todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tela, setTela] = useState<Tela>('cardapio');
  const [nome, setNome] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [pedidoNumero, setPedidoNumero] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const produtosFiltrados = useMemo(() => {
    if (categoriaAtiva === 'todos') return produtos;
    return produtos.filter((p) => p.categoria?.slug === categoriaAtiva);
  }, [categoriaAtiva, produtos]);

  const total = cart.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const totalItens = cart.reduce((s, i) => s + i.quantidade, 0);

  const addToCart = (produto: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === produto.id);
      if (existing) {
        return prev.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i)
        .filter(i => i.quantidade > 0)
    );
  };

  const getQty = (id: string) => cart.find(i => i.id === id)?.quantidade || 0;

  const confirmarPedido = async () => {
    if (!nome.trim()) return alert('Informe seu nome para continuar.');
    setLoading(true);

    const res = await createPedido({
      cliente_nome: nome,
      cliente_telefone: '',
      tipo: 'local',
      mesa_id: mesa.id,
      observacoes,
      subtotal: total,
      taxa_entrega: 0,
      total,
      itens: cart.map(i => ({
        produto_id: i.id,
        nome: i.nome,
        preco: i.preco,
        quantidade: i.quantidade,
      }))
    });

    setLoading(false);

    if (res.success && res.pedido) {
      setPedidoNumero(res.pedido.numero);
      setTela('pedido_confirmado');
      setCart([]);
    } else {
      alert('Erro ao enviar pedido. Tente novamente.');
    }
  };

  // ────────── TELA: PEDIDO CONFIRMADO ──────────
  if (tela === 'pedido_confirmado') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-4xl font-black mb-2">Pedido Enviado!</h1>
        <p className="text-zinc-400 text-lg mb-2">
          Pedido <span className="text-white font-bold">#{pedidoNumero}</span> recebido 🎉
        </p>
        <p className="text-zinc-500 mb-10">Nossa equipe já está preparando. Aguarde na mesa <strong className="text-white">{mesa.numero}</strong>.</p>
        <button
          onClick={() => setTela('cardapio')}
          className="bg-[var(--color-primary,#D97A1E)] text-white font-bold px-8 py-4 rounded-2xl text-lg"
        >
          Fazer Novo Pedido
        </button>
      </div>
    );
  }

  // ────────── TELA: CARRINHO ──────────
  if (tela === 'carrinho') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <header className="bg-zinc-900 px-5 py-4 flex items-center gap-4 border-b border-zinc-800">
          <button onClick={() => setTela('cardapio')} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">Seu Pedido</h1>
            <p className="text-zinc-400 text-sm">Mesa {mesa.numero}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
              {item.imagem && (
                <img src={item.imagem} alt={item.nome} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{item.nome}</p>
                <p className="text-[var(--color-primary,#D97A1E)] font-bold">{formatCurrency(item.preco * item.quantidade)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  {item.quantidade === 1 ? <Trash2 className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4" />}
                </button>
                <span className="w-6 text-center font-bold">{item.quantidade}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-[var(--color-primary,#D97A1E)] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 bg-zinc-900 border-t border-zinc-800 space-y-4">
          <input
            required
            placeholder="Seu nome (para chamarmos quando estiver pronto)"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm"
          />
          <textarea
            placeholder="Alguma observação? (Sem cebola, ponto da carne...)"
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm resize-none"
          />
          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <span className="text-zinc-400">Total</span>
            <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={confirmarPedido}
            disabled={loading || cart.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black text-xl py-5 rounded-2xl transition flex items-center justify-center gap-2"
          >
            <ChefHat className="w-6 h-6" />
            {loading ? 'Enviando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>
    );
  }

  // ────────── TELA: CARDÁPIO ──────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-5 pt-5 pb-0 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-zinc-400 text-sm font-medium">Mesa {mesa.numero}</p>
            <h1 className="text-xl font-black text-white">{config.nome_empresa || 'Nosso Cardápio'}</h1>
          </div>
          {totalItens > 0 && (
            <button
              onClick={() => setTela('carrinho')}
              className="relative bg-[var(--color-primary,#D97A1E)] text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Ver Pedido
              <span className="absolute -top-2 -right-2 bg-white text-[var(--color-primary,#D97A1E)] text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {totalItens}
              </span>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
          <button
            onClick={() => setCategoriaAtiva('todos')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${categoriaAtiva === 'todos' ? 'bg-[var(--color-primary,#D97A1E)] text-white' : 'bg-zinc-800 text-zinc-400'}`}
          >
            🍽️ Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCategoriaAtiva(cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${categoriaAtiva === cat.slug ? 'bg-[var(--color-primary,#D97A1E)] text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {cat.emoji} {cat.nome}
            </button>
          ))}
        </div>
      </header>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="grid grid-cols-2 gap-3">
          {produtosFiltrados.map(produto => {
            const qty = getQty(produto.id);
            return (
              <div key={produto.id} className="bg-zinc-900 rounded-2xl overflow-hidden flex flex-col">
                {produto.imagem ? (
                  <div className="relative h-32 overflow-hidden">
                    <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
                    {qty > 0 && (
                      <span className="absolute top-2 right-2 bg-[var(--color-primary,#D97A1E)] text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                        {qty}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-24 bg-zinc-800 flex items-center justify-center text-4xl">
                    🍔
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1">
                  <p className="font-bold text-white text-sm leading-tight flex-1 mb-2">{produto.nome}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[var(--color-primary,#D97A1E)] font-black text-sm">{formatCurrency(produto.preco)}</span>
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(produto)}
                        className="w-8 h-8 rounded-full bg-[var(--color-primary,#D97A1E)] flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(produto.id, -1)} className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-black">{qty}</span>
                        <button onClick={() => updateQty(produto.id, 1)} className="w-7 h-7 rounded-full bg-[var(--color-primary,#D97A1E)] flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {totalItens > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 to-transparent">
          <button
            onClick={() => setTela('carrinho')}
            className="w-full bg-[var(--color-primary,#D97A1E)] hover:opacity-90 text-white font-black text-lg py-4 rounded-2xl flex items-center justify-between px-6 shadow-2xl"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{totalItens} itens</span>
            <span>Ver Carrinho</span>
            <span className="font-black">{formatCurrency(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
