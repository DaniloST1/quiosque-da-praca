import { createAdminClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, ShoppingBag, Clock, 
  AlertTriangle, CheckCircle2, Package, DollarSign
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const revalidate = 60;

async function getDashboardData() {
  const supabase = createAdminClient();
  const hoje = startOfDay(new Date()).toISOString();
  const semanaPassada = subDays(new Date(), 7).toISOString();

  const [
    { data: pedidosHoje },
    { data: pedidosSemana },
    { data: estoqueAbaixoMinimo },
    { data: financeiroMes },
    { data: produtosMaisVendidos },
  ] = await Promise.all([
    supabase.from('pedidos').select('id, total, status, tipo, created_at')
      .gte('created_at', hoje).neq('status', 'cancelado'),
    supabase.from('pedidos').select('id, total, status, created_at')
      .gte('created_at', semanaPassada).neq('status', 'cancelado'),
    supabase.from('estoque_itens').select('id, nome, quantidade, quantidade_minima, unidade')
      .filter('quantidade', 'lte', 'quantidade_minima').eq('ativo', true),
    supabase.from('financeiro_movimentacoes').select('tipo, valor')
      .gte('data', format(new Date(), 'yyyy-MM-01')),
    supabase.from('pedido_itens').select('nome, quantidade')
      .gte('created_at', semanaPassada),
  ]);

  // Aggregations
  const totalHoje = (pedidosHoje || []).reduce((s, p) => s + Number(p.total), 0);
  const countHoje = pedidosHoje?.length || 0;
  
  const receitaMes = (financeiroMes || []).filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0);
  const despesaMes = (financeiroMes || []).filter(m => m.tipo === 'despesa').reduce((s, m) => s + Number(m.valor), 0);

  // Top 5 produtos
  const produtoMap: Record<string, number> = {};
  (produtosMaisVendidos || []).forEach(i => {
    produtoMap[i.nome] = (produtoMap[i.nome] || 0) + Number(i.quantidade);
  });
  const topProdutos = Object.entries(produtoMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([nome, qty]) => ({ nome, qty }));

  // Vendas por dia (últimos 7 dias)
  const vendasPorDia: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'dd/MM');
    vendasPorDia[d] = 0;
  }
  (pedidosSemana || []).forEach(p => {
    const d = format(new Date(p.created_at), 'dd/MM');
    if (vendasPorDia[d] !== undefined) vendasPorDia[d] += Number(p.total);
  });

  return {
    totalHoje, countHoje,
    receitaMes, despesaMes,
    lucroMes: receitaMes - despesaMes,
    estoqueAbaixoMinimo: estoqueAbaixoMinimo || [],
    topProdutos,
    vendasPorDia: Object.entries(vendasPorDia).map(([dia, total]) => ({ dia, total })),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxVenda = Math.max(...data.vendasPorDia.map(v => v.total), 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Visão geral do seu negócio — {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Faturamento Hoje"
          value={formatCurrency(data.totalHoje)}
          sub={`${data.countHoje} pedidos`}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          title="Receita do Mês"
          value={formatCurrency(data.receitaMes)}
          sub="Entradas registradas"
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          title="Despesas do Mês"
          value={formatCurrency(data.despesaMes)}
          sub="Saídas registradas"
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <KpiCard
          title="Lucro do Mês"
          value={formatCurrency(data.lucroMes)}
          sub={data.lucroMes >= 0 ? 'Positivo ✅' : 'Negativo ⚠️'}
          icon={<DollarSign className="w-5 h-5" />}
          color={data.lucroMes >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendas 7 dias */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 mb-6">Faturamento — Últimos 7 dias</h2>
          <div className="flex items-end gap-3 h-40">
            {data.vendasPorDia.map(({ dia, total }) => (
              <div key={dia} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">{formatCurrency(total)}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-secondary,#f97316)] min-h-[4px] transition-all"
                  style={{ height: `${Math.max(4, (total / maxVenda) * 120)}px` }}
                />
                <span className="text-xs font-bold text-zinc-500">{dia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Produtos */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Top Produtos (7 dias)</h2>
          {data.topProdutos.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">Sem vendas registradas</p>
          ) : (
            <div className="space-y-3">
              {data.topProdutos.map((p, i) => (
                <div key={p.nome} className="flex items-center gap-3">
                  <span className="text-sm font-black text-zinc-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{p.nome}</p>
                    <div className="h-1.5 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-full"
                        style={{ width: `${(p.qty / data.topProdutos[0].qty) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-zinc-700 shrink-0">{p.qty}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Estoque */}
      {data.estoqueAbaixoMinimo.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-800">
              Estoque Crítico ({data.estoqueAbaixoMinimo.length} itens)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.estoqueAbaixoMinimo.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl border border-amber-200 p-3 flex items-center gap-3">
                <Package className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 text-sm truncate">{item.nome}</p>
                  <p className="text-xs text-amber-600 font-medium">
                    {Number(item.quantidade).toFixed(2)} {item.unidade} 
                    <span className="text-zinc-400"> / mín {Number(item.quantidade_minima).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: { 
  title: string; value: string; sub: string; icon: React.ReactNode; 
  color: 'blue' | 'green' | 'red' | 'purple'
}) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600   border-blue-100',
    green:  'bg-green-50  text-green-600  border-green-100',
    red:    'bg-red-50    text-red-600    border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <div className={`p-2 rounded-xl border ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-400 mt-1">{sub}</p>
    </div>
  );
}
