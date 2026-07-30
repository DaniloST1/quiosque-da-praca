'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Star,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Trash2,
  ChevronDown,
  Trophy,
} from 'lucide-react';

interface Avaliacao {
  id: string;
  nome: string;
  texto: string;
  nota: number;
  produto_nome: string | null;
  cliente_id: string | null;
  publicada: boolean;
  destaque_site: boolean;
  avatar_url: string | null;
  created_at: string;
}

const NOTAS_LABELS: Record<number, string> = {
  1: 'Muito ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
};

const NOTA_COLORS: Record<number, string> = {
  1: 'text-red-500 bg-red-50',
  2: 'text-orange-500 bg-orange-50',
  3: 'text-yellow-600 bg-yellow-50',
  4: 'text-blue-600 bg-blue-50',
  5: 'text-green-600 bg-green-50',
};

function StarRow({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= nota ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`}
        />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-zinc-900">{value}</p>
        <p className="text-sm font-semibold text-zinc-500">{label}</p>
        {sub && <p className="text-xs text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

function BarChartLocal({ data }: { data: { nota: number; count: number; total: number }[] }) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((n) => {
        const item = data.find((d) => d.nota === n);
        const count = item?.count || 0;
        const total = data.reduce((s, d) => s + d.count, 0) || 1;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-14 shrink-0">
              <span className="text-xs font-bold text-zinc-600">{n}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-zinc-500 w-12 text-right">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AvaliacoesAdminClient() {
  const [all, setAll] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterNota, setFilterNota] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'publicada' | 'pendente' | 'destaque'>(
    'all'
  );
  const [filterProduto, setFilterProduto] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('avaliacoes').select('*').order('created_at', { ascending: false });
    setAll(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Metrics
  const metrics = useMemo(() => {
    const total = all.length;
    const publicadas = all.filter((a) => a.publicada).length;
    const destaques = all.filter((a) => a.destaque_site).length;
    const pendentes = all.filter((a) => !a.publicada).length;
    const avgNota = total > 0 ? (all.reduce((s, a) => s + a.nota, 0) / total).toFixed(1) : '0';
    const porNota = [1, 2, 3, 4, 5].map((n) => ({
      nota: n,
      count: all.filter((a) => a.nota === n).length,
      total,
    }));
    return { total, publicadas, destaques, pendentes, avgNota, porNota };
  }, [all]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...all];
    if (search) list = list.filter((a) => a.nome.toLowerCase().includes(search.toLowerCase()) || a.texto.toLowerCase().includes(search.toLowerCase()));
    if (filterNota) list = list.filter((a) => a.nota === filterNota);
    if (filterProduto) list = list.filter((a) => (a.produto_nome || '').toLowerCase().includes(filterProduto.toLowerCase()));
    if (filterStatus === 'publicada') list = list.filter((a) => a.publicada && !a.destaque_site);
    if (filterStatus === 'pendente') list = list.filter((a) => !a.publicada);
    if (filterStatus === 'destaque') list = list.filter((a) => a.destaque_site);
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortBy === 'highest') list.sort((a, b) => b.nota - a.nota);
    if (sortBy === 'lowest') list.sort((a, b) => a.nota - b.nota);
    return list;
  }, [all, search, filterNota, filterProduto, filterStatus, sortBy]);

  const toggle = async (id: string, field: 'publicada' | 'destaque_site', current: boolean) => {
    setUpdating(id);
    const update: any = { [field]: !current };
    if (field === 'destaque_site' && !current) update.publicada = true;
    await supabase.from('avaliacoes').update(update).eq('id', id);
    setAll((prev) => prev.map((a) => (a.id === id ? { ...a, ...update } : a)));
    setUpdating(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta avaliação permanentemente?')) return;
    await supabase.from('avaliacoes').delete().eq('id', id);
    setAll((prev) => prev.filter((a) => a.id !== id));
  };

  const produtos = useMemo(() => {
    const set = new Set(all.map((a) => a.produto_nome).filter(Boolean));
    return Array.from(set) as string[];
  }, [all]);

  return (
    <div className="space-y-6">

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total de Avaliações" value={metrics.total} icon={MessageSquare} color="bg-blue-50 text-blue-600" />
        <MetricCard label="Nota Média" value={`${metrics.avgNota}/5`} icon={Star} color="bg-yellow-50 text-yellow-600" />
        <MetricCard label="Publicadas" value={metrics.publicadas} sub={`${metrics.pendentes} pendentes`} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <MetricCard label="Destaque no Site" value={metrics.destaques} sub="Exibidas em 'O que dizem'" icon={Trophy} color="bg-orange-50 text-orange-600" />
      </div>

      {/* Gráfico de distribuição */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-zinc-600" />
          <h3 className="font-bold text-zinc-900">Distribuição de Notas</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-zinc-900">{metrics.avgNota}</span>
            <div className="flex gap-1 my-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(parseFloat(metrics.avgNota)) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />
              ))}
            </div>
            <span className="text-sm text-zinc-500">{metrics.total} avaliações</span>
          </div>
          <div className="flex-1 w-full">
            <BarChartLocal data={metrics.porNota} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por cliente ou comentário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="all">Todos os Status</option>
            <option value="destaque">⭐ Destaque no Site</option>
            <option value="publicada">✓ Publicadas</option>
            <option value="pendente">⏳ Pendentes</option>
          </select>

          {/* Nota */}
          <select
            value={filterNota || ''}
            onChange={(e) => setFilterNota(e.target.value ? parseInt(e.target.value) : null)}
            className="text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">Todas as Notas</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} estrela{n !== 1 ? 's' : ''}</option>)}
          </select>

          {/* Produto */}
          {produtos.length > 0 && (
            <select
              value={filterProduto}
              onChange={(e) => setFilterProduto(e.target.value)}
              className="text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Todos os Produtos</option>
              {produtos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="highest">Maior nota</option>
            <option value="lowest">Menor nota</option>
          </select>

          <span className="text-sm text-zinc-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 'ados' : 'ado'}</span>
        </div>
      </div>

      {/* Lista de avaliações */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">Nenhuma avaliação encontrada.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((av) => (
              <div key={av.id} className={`p-5 flex gap-4 hover:bg-zinc-50 transition-colors ${av.destaque_site ? 'border-l-4 border-yellow-400' : ''}`}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 overflow-hidden border border-[var(--color-primary)]/20">
                  {av.avatar_url ? (
                    <img src={av.avatar_url} alt={av.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[var(--color-primary)] text-sm font-bold">
                      {av.nome?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-zinc-900 text-sm">{av.nome}</span>
                    <StarRow nota={av.nota} />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${NOTA_COLORS[av.nota]}`}>
                      {NOTAS_LABELS[av.nota]}
                    </span>
                    {av.produto_nome && (
                      <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                        {av.produto_nome}
                      </span>
                    )}
                    {av.destaque_site && (
                      <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Trophy className="w-2.5 h-2.5" /> Destaque
                      </span>
                    )}
                    {!av.publicada && (
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full">
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{av.texto}</p>
                  <p className="text-xs text-zinc-400 mt-1.5">
                    {new Date(av.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Destaque no site */}
                  <button
                    onClick={() => toggle(av.id, 'destaque_site', av.destaque_site)}
                    disabled={updating === av.id}
                    title={av.destaque_site ? 'Remover do destaque' : 'Destacar no site'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      av.destaque_site
                        ? 'bg-yellow-400 text-yellow-900 border-yellow-400 hover:bg-yellow-300'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-yellow-300 hover:text-yellow-700 hover:bg-yellow-50'
                    }`}
                  >
                    <Trophy className="w-3 h-3" />
                    {av.destaque_site ? 'Destacada' : 'Destacar'}
                  </button>

                  {/* Publicar */}
                  <button
                    onClick={() => toggle(av.id, 'publicada', av.publicada)}
                    disabled={updating === av.id}
                    title={av.publicada ? 'Ocultar' : 'Publicar'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      av.publicada
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                    }`}
                  >
                    {av.publicada ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {av.publicada ? 'Visível' : 'Oculta'}
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => handleDelete(av.id)}
                    title="Excluir"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border bg-zinc-50 text-red-400 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
