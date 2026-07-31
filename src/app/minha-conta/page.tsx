'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag, DollarSign, Star, Award, Clock, ArrowRight, Heart,
  TrendingUp, ChevronRight, Flame, MessageSquare, Package, Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface PedidoSimples {
  id: string;
  numero: number;
  total: number;
  created_at: string;
  status: string;
}

interface TopItem {
  nome: string;
  quantidade: number;
  imagem: string | null;
}

interface Sugestao {
  id: string;
  nome: string;
  preco: number;
  imagem: string | null;
  descricao: string | null;
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

export default function MinhaContaDashboard() {
  const { user, cliente, loading: authLoading, authError, openAuthModal, clearAuthError } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ totalPedidos: 0, totalGasto: 0 });
  const [ultimoPedido, setUltimoPedido] = useState<PedidoSimples | null>(null);
  const [topItens, setTopItens] = useState<TopItem[]>([]);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [avaliacoesPendentes, setAvaliacoesPendentes] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    if (cliente?.id) {
      loadAll(cliente.id);
    } else {
      // Se user está logado mas cliente ainda não retornou id, carrega sugestões
      loadSugestoesOnly();
    }
  }, [authLoading, user, cliente?.id]);

  async function loadSugestoesOnly() {
    try {
      const { data: bestSellers } = await supabase
        .from('produtos')
        .select('id, nome, preco, imagem, descricao')
        .eq('best_seller', true)
        .eq('ativo', true)
        .limit(4);

      setSugestoes(bestSellers || []);
    } catch {}
    setLoading(false);
  }

  async function loadAll(clienteId: string) {
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
        setStats({ totalPedidos: pedidos.length, totalGasto: totGasto });
        setUltimoPedido(pedidos[0]);

        // Top itens pedidos
        const { data: itens } = await supabase
          .from('pedido_itens')
          .select('nome, quantidade, produto_id')
          .in('pedido_id', pedidos.map((p) => p.id));

        if (itens && itens.length > 0) {
          const contagem: Record<string, { quantidade: number; produtoId: string | null }> = {};
          itens.forEach((it) => {
            if (!contagem[it.nome]) contagem[it.nome] = { quantidade: 0, produtoId: it.produto_id };
            contagem[it.nome].quantidade += it.quantidade;
          });

          const ordenados = Object.entries(contagem)
            .sort((a, b) => b[1].quantidade - a[1].quantidade)
            .slice(0, 3);

          const nomesTop = ordenados.map(([nome]) => nome);
          const { data: prods } = await supabase
            .from('produtos')
            .select('nome, imagem')
            .in('nome', nomesTop);

          const imgMap: Record<string, string | null> = {};
          prods?.forEach((p) => { imgMap[p.nome] = p.imagem; });

          setTopItens(ordenados.map(([nome, v]) => ({
            nome,
            quantidade: v.quantidade,
            imagem: imgMap[nome] || null,
          })));

          const { count } = await supabase
            .from('avaliacoes')
            .select('id', { count: 'exact', head: true })
            .eq('cliente_id', clienteId);
          setAvaliacoesPendentes(pedidos.length - (count || 0));
        }
      }

      // Sugestões
      const { data: bestSellers } = await supabase
        .from('produtos')
        .select('id, nome, preco, imagem, descricao')
        .eq('best_seller', true)
        .eq('ativo', true)
        .limit(4);

      setSugestoes(bestSellers || []);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-zinc-200 text-center shadow-xs max-w-md mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-orange-100 text-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-zinc-900 font-heading">Você não está autenticado</h2>
        <p className="text-sm text-zinc-500">
          Entre na sua conta para visualizar seus pedidos, pontos e endereços cadastrados.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 px-6 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-secondary)] transition-colors"
        >
          Entrar ou Criar Conta
        </button>
      </div>
    );
  }

  const nomeCliente = cliente?.nome || user?.email?.split('@')[0] || 'Cliente';
  const primeiroNome = nomeCliente.split(' ')[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6">
      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-700 text-sm">
          <span>{authError}</span>
          <button onClick={clearAuthError} className="font-bold underline text-xs ml-2">Fechar</button>
        </div>
      )}

      {/* Boas Vindas */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-orange-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-orange-200 text-sm font-medium">{saudacao},</p>
            <h1 className="text-2xl font-black mt-0.5">{primeiroNome}! 👋</h1>
            <p className="text-orange-100 text-sm mt-1 opacity-90">
              Bem-vindo ao seu portal exclusivo do Quiosque da Praça.
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3 shrink-0">
            <Award className="w-6 h-6 text-yellow-300" />
            <div>
              <p className="text-xs text-orange-100 font-semibold uppercase tracking-wide">Pontos Fidelidade</p>
              <p className="text-2xl font-black">{cliente?.pontos || 0} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Pedidos</p>
            <p className="text-xl font-black text-zinc-900">{stats.totalPedidos}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total Gasto</p>
            <p className="text-lg font-black text-zinc-900">{formatCurrency(stats.totalGasto)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Favorito</p>
            <p className="text-sm font-bold text-zinc-900 truncate max-w-[100px]">
              {topItens[0]?.nome || '—'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Último Pedido</p>
            <p className="text-sm font-bold text-zinc-900">
              {ultimoPedido ? `#${ultimoPedido.numero}` : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-3 space-y-5">
          {/* Último Pedido */}
          {ultimoPedido && (() => {
            const st = STATUS_LABELS[ultimoPedido.status] || { label: ultimoPedido.status, color: 'bg-zinc-100 text-zinc-700' };
            return (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[var(--color-primary)]" />
                    Último Pedido
                  </h2>
                  <Link href="/minha-conta/pedidos" className="text-xs text-[var(--color-primary)] hover:underline font-semibold">
                    Ver todos →
                  </Link>
                </div>
                <Link href={`/minha-conta/pedidos/${ultimoPedido.id}`} className="block group">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-[var(--color-primary)] transition-all">
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-900">Pedido #{ultimoPedido.numero}</span>
                      <div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {new Date(ultimoPedido.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[var(--color-primary)] text-lg">{formatCurrency(ultimoPedido.total)}</span>
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })()}

          {/* Itens mais pedidos */}
          {topItens.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5">
              <h2 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-500" />
                Seus Favoritos de Pedido
              </h2>
              <div className="space-y-3">
                {topItens.map((item, i) => (
                  <div key={item.nome} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                    <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      i === 0 ? 'bg-yellow-400 text-yellow-900' :
                      i === 1 ? 'bg-zinc-300 text-zinc-700' :
                      'bg-amber-700/20 text-amber-800'
                    }`}>{i + 1}</span>
                    {item.imagem ? (
                      <img src={item.imagem} alt={item.nome} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-200 shrink-0 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 truncate">{item.nome}</p>
                      <p className="text-xs text-zinc-400">{item.quantidade}x pedido{item.quantidade !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avaliações pendentes */}
          {avaliacoesPendentes > 0 && (
            <Link href="/minha-conta/avaliacoes" className="block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 hover:border-[var(--color-primary)] transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">Deixe sua avaliação!</p>
                    <p className="text-xs text-zinc-500">Compartilhe sua experiência com nossos produtos</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )}
        </div>

        {/* Coluna lateral — Sugestões */}
        <div className="lg:col-span-2 space-y-5">
          {sugestoes.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5">
              <h2 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-red-500" />
                Experimente também
              </h2>
              <div className="space-y-3">
                {sugestoes.map((prod) => (
                  <div key={prod.id} className="flex items-center gap-3">
                    {prod.imagem ? (
                      <img src={prod.imagem} alt={prod.nome} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 shrink-0 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-zinc-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 truncate">{prod.nome}</p>
                      <p className="text-xs text-zinc-500 line-clamp-1">{prod.descricao}</p>
                      <p className="text-xs font-bold text-[var(--color-primary)] mt-0.5">{formatCurrency(prod.preco)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/#cardapio"
                className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:bg-orange-50 py-2.5 rounded-xl border border-orange-200 transition-colors"
              >
                Ver Cardápio Completo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Ações rápidas */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5">
            <h2 className="font-bold text-zinc-900 mb-3 text-sm">Ações Rápidas</h2>
            <div className="space-y-2">
              {[
                { href: '/minha-conta/pedidos', icon: ShoppingBag, label: 'Meus Pedidos', sub: `${stats.totalPedidos} pedidos` },
                { href: '/minha-conta/favoritos', icon: Heart, label: 'Favoritos', sub: 'Itens salvos' },
                { href: '/minha-conta/avaliacoes', icon: MessageSquare, label: 'Avaliações', sub: 'Compartilhe sua opinião' },
              ].map(({ href, icon: Icon, label, sub }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900">{label}</p>
                    <p className="text-xs text-zinc-400">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
