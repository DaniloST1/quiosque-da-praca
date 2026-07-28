'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Users, Phone, Mail, TrendingUp, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 20;

interface ClienteRow {
  id: string;
  auth_user_id?: string | null;
  foto_url?: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  telefone_normalizado: string;
  aceita_whatsapp: boolean;
  created_at: string;
  total_pedidos?: number;
  total_gasto?: number;
  ticket_medio?: number;
  primeiro_pedido?: string;
  ultimo_pedido?: string;
}

function StatCard({ icon: Icon, label, value, color = 'zinc' }: any) {
  const colorMap: Record<string, string> = {
    zinc: 'bg-zinc-100 text-zinc-600',
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

export function ClientesAdminClient() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, comEmail: 0, aceitaWpp: 0 });

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (busca.trim()) {
      const b = busca.trim();
      const bNorm = b.replace(/\D/g, '');
      query = query.or(
        `nome.ilike.%${b}%,email.ilike.%${b}%${bNorm ? `,telefone_normalizado.ilike.%${bNorm}%` : ''}`
      );
    }

    const { data, count, error } = await query;
    if (!error && data) {
      // Enriquecer com métricas de pedidos
      const enriched = await Promise.all(
        (data as ClienteRow[]).map(async (c) => {
          const { data: pedidos } = await supabase
            .from('pedidos')
            .select('total, created_at')
            .eq('cliente_id', c.id);

          const totPed = pedidos?.length || 0;
          const totGasto = pedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
          const datas = pedidos?.map(p => p.created_at).sort() || [];
          return {
            ...c,
            total_pedidos: totPed,
            total_gasto: totGasto,
            ticket_medio: totPed > 0 ? totGasto / totPed : 0,
            primeiro_pedido: datas[0] || null,
            ultimo_pedido: datas[datas.length - 1] || null,
          };
        })
      );
      setClientes(enriched);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [busca, page]);

  const fetchStats = useCallback(async () => {
    const { count: totalCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
    const { count: emailCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).not('email', 'is', null);
    const { count: wppCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('aceita_whatsapp', true);
    setStats({ total: totalCount || 0, comEmail: emailCount || 0, aceitaWpp: wppCount || 0 });
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total de Clientes" value={stats.total} color="primary" />
        <StatCard icon={Mail} label="Com E-mail" value={stats.comEmail} color="blue" />
        <StatCard icon={Phone} label="Aceitam WhatsApp" value={stats.aceitaWpp} color="green" />
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Contato</th>
                <th className="px-5 py-3 text-center">Pedidos</th>
                <th className="px-5 py-3 text-right">Total Gasto</th>
                <th className="px-5 py-3 text-right">Ticket Médio</th>
                <th className="px-5 py-3">Último Pedido</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-zinc-400">Carregando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-zinc-400">Nenhum cliente encontrado.</td></tr>
              ) : clientes.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                        {c.foto_url ? (
                          <img src={c.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-[var(--color-primary)]">{c.nome?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-800">{c.nome}</span>
                          {c.auth_user_id && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-green-100 text-green-700" title="Conta com login ativa">
                              Conta Registrada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-zinc-700">{c.telefone || '—'}</p>
                    {c.email && <p className="text-xs text-zinc-400">{c.email}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">
                      {c.total_pedidos || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-zinc-800">
                    {formatCurrency(c.total_gasto || 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-zinc-600">
                    {formatCurrency(c.ticket_medio || 0)}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 text-xs">
                    {c.ultimo_pedido ? new Date(c.ultimo_pedido).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/clientes/${c.id}`}
                      className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                      <User className="w-3 h-3" /> Ver perfil
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-400">{total} clientes no total</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-zinc-600">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-100 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
