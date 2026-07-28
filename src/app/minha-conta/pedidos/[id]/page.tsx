'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  ChefHat, 
  Truck, 
  ShoppingBag, 
  RotateCcw, 
  Star, 
  MapPin, 
  CreditCard,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PedidoDetalhe {
  id: string;
  numero: number;
  created_at: string;
  total: number;
  subtotal: number;
  taxa_entrega: number;
  status: string;
  tipo: string;
  metodo_pagamento: string | null;
  observacoes: string | null;
  cliente_endereco: string | null;
  cliente_numero: string | null;
  cliente_bairro: string | null;
  cliente_cep: string | null;
  avaliado: boolean;
  itens: Array<{
    id: string;
    produto_id: string;
    nome: string;
    preco: number;
    quantidade: number;
    observacoes: string | null;
    produto?: {
      imagem_url: string | null;
    };
  }>;
}

const STEPS = [
  { key: 'novo', label: 'Pedido Recebido', icon: Package },
  { key: 'pagamento_confirmado', label: 'Pagamento Confirmado', icon: CheckCircle2 },
  { key: 'em_preparo', label: 'Em Preparação', icon: ChefHat },
  { key: 'saiu_entrega', label: 'Saiu para Entrega', icon: Truck },
  { key: 'concluido', label: 'Entregue', icon: ShoppingBag },
];

export default function PedidoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { cliente } = useAuth();
  const cart = useCart();

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPedido = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, itens:pedido_itens(*, produto:produtos(imagem_url))')
      .eq('id', id)
      .single();

    if (!error && data) {
      setPedido(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPedido();

    // Inscrição Realtime no status deste pedido específico
    const channel = supabase
      .channel(`pedido_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) {
            setPedido((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handlePedirNovamente = () => {
    if (!pedido?.itens) return;

    // Recria os itens no carrinho
    cart.clearCart();
    pedido.itens.forEach((it) => {
      cart.addItem({
        id: it.produto_id,
        nome: it.nome,
        preco: it.preco,
        imagem_url: it.produto?.imagem_url || null,
      } as any);
    });

    cart.openCart();
  };

  if (loading) {
    return <div className="text-zinc-500 text-xs py-12 text-center">Carregando detalhes do pedido...</div>;
  }

  if (!pedido) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-zinc-200">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-zinc-700">Pedido não encontrado</p>
      </div>
    );
  }

  // Determinar a posição da timeline de status
  const currentStepIndex = STEPS.findIndex((s) => s.key === pedido.status);
  const isCancelado = pedido.status === 'cancelado';

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 font-heading">Pedido #{pedido.numero}</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Realizado em {new Date(pedido.created_at).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handlePedirNovamente} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Pedir Novamente
          </Button>

          {!pedido.avaliado && (pedido.status === 'concluido' || pedido.status === 'entregue') && (
            <Link href={`/avaliar/${pedido.id}`}>
              <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600">
                <Star className="w-4 h-4" />
                Avaliar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Timeline Realtime do Status */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs">
        <h2 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-wider">Acompanhamento do Pedido</h2>

        {isCancelado ? (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Este pedido foi cancelado.
          </div>
        ) : (
          <div className="relative flex items-center justify-between">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 -translate-y-1/2 z-0" />
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                    } ${isCurrent ? 'ring-4 ring-orange-200 scale-110' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-semibold mt-2 text-center max-w-[80px] ${
                    isDone ? 'text-zinc-900 font-bold' : 'text-zinc-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Itens Comprados */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Itens do Pedido</h2>

        <div className="divide-y divide-zinc-100">
          {pedido.itens?.map((it) => (
            <div key={it.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400 font-bold text-xs">
                  {it.produto?.imagem_url ? (
                    <img src={it.produto.imagem_url} alt={it.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span>{it.quantidade}x</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm text-zinc-900">
                    {it.quantidade}x {it.nome}
                  </p>
                  {it.observacoes && (
                    <p className="text-xs text-zinc-500 italic">Obs: {it.observacoes}</p>
                  )}
                </div>
              </div>

              <span className="font-bold text-sm text-zinc-900">
                {formatCurrency(it.preco * it.quantidade)}
              </span>
            </div>
          ))}
        </div>

        {/* Resumo Financeiro */}
        <div className="pt-4 border-t border-zinc-100 space-y-2 text-xs text-zinc-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(pedido.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de Entrega</span>
            <span className="font-semibold">{formatCurrency(pedido.taxa_entrega || 0)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-100">
            <span>Total</span>
            <span className="text-[var(--color-primary)]">{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
