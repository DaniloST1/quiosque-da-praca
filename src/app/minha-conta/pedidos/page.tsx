'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag, ChevronRight, Clock, Search, Filter,
  Flame, Package, Loader2, Star, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

import { Produto } from '@/types/database';

interface PedidoRow {
  id: string;
  numero: number;
  created_at: string;
  total: number;
  status: string;
  tipo: string;
}

interface TopItem {
  nome: string;
  quantidade: number;
  produto: Produto | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo: { label: 'Pedido Recebido', color: 'bg-blue-100 text-blue-700' },
  pagamento_confirmado: { label: 'Pagamento Confirmado', color: 'bg-indigo-100 text-indigo-700' },
  em_preparo: { label: 'Em Preparação 🔥', color: 'bg-orange-100 text-orange-700' },
  pronto_retirada: { label: 'Pronto para Retirada', color: 'bg-purple-100 text-purple-700' },
  saiu_entrega: { label: 'Saiu para Entrega 🛵', color: 'bg-amber-100 text-amber-700' },
  concluido: { label: 'Entregue ✓', color: 'bg-green-100 text-green-700' },
  entregue: { label: 'Entregue ✓', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const ATIVOS = ['novo', 'pagamento_confirmado', 'em_preparo', 'pronto_retirada', 'saiu_entrega'];

export default function PedidosPage() {
  const { cliente } = useAuth();
  const cart = useCart();
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [topItens, setTopItens] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  useEffect(() => {
    if (!cliente?.id) return;
    fetchAll(cliente.id);
  }, [cliente?.id]);

  async function fetchAll(clienteId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero, created_at, total, status, tipo')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (data) {
      setPedidos(data);

      // Top itens
      if (data.length > 0) {
        const { data: itens } = await supabase
          .from('pedido_itens')
          .select('nome, quantidade, produto_id')
          .in('pedido_id', data.map((p) => p.id));

        if (itens && itens.length > 0) {
          const contagem: Record<string, { quantidade: number; produtoId: string | null }> = {};
          itens.forEach((it) => {
            if (!contagem[it.nome]) contagem[it.nome] = { quantidade: 0, produtoId: it.produto_id };
            contagem[it.nome].quantidade += it.quantidade;
          });

          const ordenados = Object.entries(contagem)
            .sort((a, b) => b[1].quantidade - a[1].quantidade)
            .slice(0, 5);

          const nomesTop = ordenados.map(([nome]) => nome);
          const { data: prods } = await supabase
            .from('produtos')
            .select('*')
            .in('nome', nomesTop);

          const prodMap: Record<string, Produto> = {};
          prods?.forEach((p) => { prodMap[p.nome] = p as Produto; });

          setTopItens(
            ordenados.map(([nome, v]) => ({
              nome,
              quantidade: v.quantidade,
              produto: prodMap[nome] || null,
            }))
          );
        }
      }
    }
    setLoading(false);
  }

  const ultimoPedido = pedidos[0] || null;
  const restantes = pedidos.slice(1);

  const filtrados = useMemo(() => {
    let list = restantes;
    if (search) list = list.filter((p) => String(p.numero).includes(search));
    if (filterStatus !== 'todos') {
      if (filterStatus === 'ativos') list = list.filter((p) => ATIVOS.includes(p.status));
      else list = list.filter((p) => p.status === filterStatus);
    }
    return list;
  }, [restantes, search, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 font-heading">Meus Pedidos</h1>
          <p className="text-xs text-zinc-500 mt-1">Acompanhe seus pedidos ativos e consulte o histórico.</p>
        </div>
        <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 shadow-xs">
          <ShoppingBag className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-zinc-700 mb-1">Nenhum pedido realizado ainda</h2>
          <p className="text-sm text-zinc-400 mb-6">Que tal explorar nosso cardápio e fazer seu primeiro pedido?</p>
          <Link
            href="/#cardapio"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-secondary)] transition-colors"
          >
            Ver Cardápio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 font-heading">Meus Pedidos</h1>
        <p className="text-xs text-zinc-500 mt-1">Acompanhe seus pedidos ativos e consulte o histórico.</p>
      </div>

      {/* Último pedido em destaque */}
      {ultimoPedido && (() => {
        const st = STATUS_LABELS[ultimoPedido.status] || { label: ultimoPedido.status, color: 'bg-zinc-100 text-zinc-700' };
        const isAtivo = ATIVOS.includes(ultimoPedido.status);
        return (
          <div className={`rounded-2xl border-2 p-6 shadow-sm ${isAtivo ? 'border-[var(--color-primary)] bg-orange-50' : 'border-zinc-200 bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Package className={`w-5 h-5 ${isAtivo ? 'text-[var(--color-primary)]' : 'text-zinc-500'}`} />
              <span className="font-bold text-zinc-900">Pedido Mais Recente</span>
              {isAtivo && (
                <span className="ml-auto text-xs font-bold text-[var(--color-primary)] bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                  EM ANDAMENTO
                </span>
              )}
            </div>

            <Link href={`/minha-conta/pedidos/${ultimoPedido.id}`} className="block group">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-black text-zinc-900">Pedido #{ultimoPedido.numero}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ultimoPedido.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                    &nbsp;• <span className="capitalize">{ultimoPedido.tipo}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xl font-black text-[var(--color-primary)]">{formatCurrency(ultimoPedido.total)}</span>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* Histórico com filtros */}
      {restantes.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex flex-wrap gap-3 items-center">
            <h2 className="font-bold text-zinc-900 text-sm mr-auto">Histórico de Pedidos</h2>

            {/* Busca por número */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Nº pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] w-32"
              />
            </div>

            {/* Filtro status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Em andamento</option>
              <option value="concluido">Entregues</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          <div className="divide-y divide-zinc-100">
            {filtrados.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-sm">Nenhum pedido encontrado.</div>
            ) : (
              filtrados.map((ped) => {
                const st = STATUS_LABELS[ped.status] || { label: ped.status, color: 'bg-zinc-100 text-zinc-700' };
                return (
                  <Link
                    key={ped.id}
                    href={`/minha-conta/pedidos/${ped.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">#{ped.numero}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {new Date(ped.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        &nbsp;• <span className="capitalize">{ped.tipo}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-900 text-sm">{formatCurrency(ped.total)}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Itens mais pedidos */}
      {topItens.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-orange-500" />
            Seus Favoritos — Peça de Novo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topItens.map((item) => (
              <div key={item.nome} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50">
                {item.produto?.imagem ? (
                  <img src={item.produto.imagem} alt={item.nome} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-200 shrink-0 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 truncate">{item.nome}</p>
                  <p className="text-xs text-zinc-400">{item.quantidade}x pedido{item.quantidade !== 1 ? 's' : ''}</p>
                  {item.produto?.preco ? (
                    <p className="text-xs font-bold text-[var(--color-primary)]">{formatCurrency(item.produto.preco)}</p>
                  ) : null}
                </div>
                {item.produto && (
                  <button
                    onClick={() => {
                      cart.addItem(item.produto!);
                      cart.openCart();
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-colors shrink-0"
                  >
                    + Pedir
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
