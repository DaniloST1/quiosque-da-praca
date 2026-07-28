'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, User, Phone, Mail, MapPin, MessageCircle, Calendar, TrendingUp, ShoppingBag, DollarSign, Hash } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Pedido {
  id: string;
  numero: number;
  tipo: string;
  status: string;
  total: number;
  created_at: string;
  metodo_pagamento?: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  endereco: any;
  aceita_whatsapp: boolean;
  observacoes: string | null;
  created_at: string;
}

function Badge({ children, color = 'zinc' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    zinc: 'bg-zinc-100 text-zinc-600',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>{children}</span>;
}

const statusColors: Record<string, string> = {
  novo: 'blue', em_preparo: 'amber', pronto: 'green', entregue: 'green', cancelado: 'red',
};

export function ClienteDetalheClient({ id }: { id: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: ps }] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', id).single(),
        supabase.from('pedidos').select('id, numero, tipo, status, total, created_at, metodo_pagamento')
          .eq('cliente_id', id).order('created_at', { ascending: false }),
      ]);
      setCliente(c);
      setPedidos(ps || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="text-zinc-400 text-sm py-10 text-center">Carregando perfil...</div>;
  if (!cliente) return <div className="text-red-500 py-10 text-center">Cliente não encontrado.</div>;

  const totalGasto = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  const ticketMedio = pedidos.length > 0 ? totalGasto / pedidos.length : 0;
  const datas = pedidos.map(p => p.created_at).sort();
  const primeiroPedido = datas[0];
  const ultimoPedido = datas[datas.length - 1];
  const endereco = cliente.endereco || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clientes" className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <span className="text-sm font-bold text-[var(--color-primary)]">{cliente.nome?.[0]?.toUpperCase()}</span>
            </div>
            {cliente.nome}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Cliente desde {new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Dados Cadastrais */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><User className="w-4 h-4" /> Dados do Cliente</h2>
            <div className="space-y-2.5 text-sm">
              {cliente.telefone && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="w-4 h-4 shrink-0 text-zinc-400" />
                  {cliente.telefone}
                  {cliente.aceita_whatsapp && <MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Mail className="w-4 h-4 shrink-0 text-zinc-400" />
                  {cliente.email}
                </div>
              )}
              {endereco.logradouro && (
                <div className="flex items-start gap-2 text-zinc-600">
                  <MapPin className="w-4 h-4 shrink-0 text-zinc-400 mt-0.5" />
                  <span>
                    {endereco.logradouro}, {endereco.numero}
                    {endereco.complemento && `, ${endereco.complemento}`}
                    <br />{endereco.bairro}
                    {endereco.cidade && ` — ${endereco.cidade}/${endereco.estado}`}
                    {endereco.cep && <><br />CEP: {endereco.cep}</>}
                  </span>
                </div>
              )}
              {cliente.observacoes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-700">
                  💬 {cliente.observacoes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métricas + Histórico */}
        <div className="md:col-span-2 space-y-4">
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Hash, label: 'Pedidos', value: pedidos.length, color: 'text-[var(--color-primary)]' },
              { icon: DollarSign, label: 'Total Gasto', value: formatCurrency(totalGasto), color: 'text-green-600' },
              { icon: TrendingUp, label: 'Ticket Médio', value: formatCurrency(ticketMedio), color: 'text-blue-600' },
              { icon: ShoppingBag, label: 'Último Pedido', value: ultimoPedido ? new Date(ultimoPedido).toLocaleDateString('pt-BR') : '—', color: 'text-zinc-600' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-zinc-200 p-3">
                <m.icon className={`w-4 h-4 mb-1.5 ${m.color}`} />
                <p className="text-xs text-zinc-500">{m.label}</p>
                <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Histórico de Pedidos */}
          <div className="bg-white rounded-xl border border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-700 p-4 border-b border-zinc-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Histórico de Compras ({pedidos.length})
            </h2>
            {pedidos.length === 0 ? (
              <p className="text-zinc-400 text-sm text-center py-8">Nenhum pedido vinculado ainda.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {pedidos.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-zinc-400">#{p.numero}</span>
                      <Badge color={statusColors[p.status] || 'zinc'}>{p.status.replace('_', ' ')}</Badge>
                      <span className="text-zinc-500 text-xs capitalize">{p.tipo === 'local' ? 'Na Mesa' : p.tipo}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                      <span className="font-bold text-zinc-800">{formatCurrency(p.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
