'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, DollarSign, Star, Award, Clock, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';

export default function MinhaContaDashboard() {
  const { user, cliente, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalPedidos: 0,
    totalGasto: 0,
    produtoMaisPedido: 'Nenhum',
    ultimoPedido: null as any,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clienteId = cliente?.id;
    if (!clienteId) return;

    async function loadDashboardStats() {
      setLoading(true);
      try {
        // Pedidos do cliente
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select('id, numero, total, created_at, status')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });

        if (pedidos && pedidos.length > 0) {
          const totGasto = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);

          // Buscar o produto mais pedido
          const { data: itens } = await supabase
            .from('pedido_itens')
            .select('nome, quantidade')
            .in('pedido_id', pedidos.map(p => p.id));

          let topProduto = 'Nenhum';
          if (itens && itens.length > 0) {
            const contagem: Record<string, number> = {};
            itens.forEach((it) => {
              contagem[it.nome] = (contagem[it.nome] || 0) + it.quantidade;
            });
            const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
            if (ordenados[0]) topProduto = ordenados[0][0];
          }

          setStats({
            totalPedidos: pedidos.length,
            totalGasto: totGasto,
            produtoMaisPedido: topProduto,
            ultimoPedido: pedidos[0],
          });
        }
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, [cliente?.id]);

  if (authLoading || loading) {
    return <div className="text-zinc-500 text-sm py-12 text-center">Carregando dashboard do cliente...</div>;
  }

  const nomeCliente = cliente?.nome || user?.email?.split('@')[0] || 'Cliente';

  return (
    <div className="space-y-8">
      {/* Header Boas Vindas */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 font-heading">
            Olá, <span className="text-[var(--color-primary)]">{nomeCliente}</span>! 👋
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Bem-vindo ao seu portal exclusivo do Quiosque da Praça.
          </p>
        </div>

        {/* Card Saldo de Pontos */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200/60 rounded-xl p-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Pontos Fidelidade</p>
            <p className="text-xl font-black text-amber-900">{cliente?.pontos || 0} pts</p>
          </div>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total de Pedidos</p>
            <p className="text-2xl font-black text-zinc-900">{stats.totalPedidos}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Gasto</p>
            <p className="text-2xl font-black text-zinc-900">{formatCurrency(stats.totalGasto)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">Mais Pedido</p>
            <p className="text-sm font-bold text-zinc-900 truncate max-w-[140px]">{stats.produtoMaisPedido}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">Último Pedido</p>
            <p className="text-sm font-bold text-zinc-900">
              {stats.ultimoPedido ? `#${stats.ultimoPedido.numero}` : 'Nenhum'}
            </p>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/minha-conta/pedidos"
          className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-[var(--color-primary)] transition-all group flex items-center justify-between shadow-2xs"
        >
          <div>
            <h3 className="font-bold text-zinc-900 group-hover:text-[var(--color-primary)] transition-colors">
              Histórico & Acompanhamento
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Veja seus pedidos anteriores e status em tempo real.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/minha-conta/favoritos"
          className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-[var(--color-primary)] transition-all group flex items-center justify-between shadow-2xs"
        >
          <div>
            <h3 className="font-bold text-zinc-900 group-hover:text-[var(--color-primary)] transition-colors">
              Meus Favoritos
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Acesse seus pratos salvos e peça novamente em 1 clique.</p>
          </div>
          <Heart className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
