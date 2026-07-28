import { createAdminClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, TrendingUp, ShoppingBag, Clock, Star } from 'lucide-react';

export const revalidate = 300;

async function getRelatorioData(mes: string) {
  const supabase = createAdminClient();
  const inicioMes = startOfMonth(new Date(mes + '-02'));
  const fimMes = endOfMonth(new Date(mes + '-02'));

  const [
    { data: pedidos },
    { data: pedidoItens },
    { data: financeiro },
  ] = await Promise.all([
    supabase.from('pedidos').select('id, total, status, tipo, created_at, tempo_preparo_minutos, entregue_em, preparo_em')
      .gte('created_at', inicioMes.toISOString())
      .lte('created_at', fimMes.toISOString()),
    supabase.from('pedido_itens').select('nome, quantidade, preco, pedido_id, created_at')
      .gte('created_at', inicioMes.toISOString())
      .lte('created_at', fimMes.toISOString()),
    supabase.from('financeiro_movimentacoes').select('tipo, valor, data, categoria:financeiro_categorias(nome)')
      .gte('data', format(inicioMes, 'yyyy-MM-dd'))
      .lte('data', format(fimMes, 'yyyy-MM-dd')),
  ]);

  const pedidosConcluidos = (pedidos || []).filter(p => p.status !== 'cancelado');
  const pedidosCancelados = (pedidos || []).filter(p => p.status === 'cancelado');

  // Faturamento por dia
  const vendasDia: Record<string, number> = {};
  eachDayOfInterval({ start: inicioMes, end: fimMes }).forEach(d => {
    vendasDia[format(d, 'dd/MM')] = 0;
  });
  pedidosConcluidos.forEach(p => {
    const dia = format(new Date(p.created_at), 'dd/MM');
    if (vendasDia[dia] !== undefined) vendasDia[dia] += Number(p.total);
  });

  // Top produtos
  const prodMap: Record<string, { qty: number; receita: number }> = {};
  (pedidoItens || []).forEach(i => {
    const k = i.nome;
    if (!prodMap[k]) prodMap[k] = { qty: 0, receita: 0 };
    prodMap[k].qty += Number(i.quantidade);
    prodMap[k].receita += Number(i.preco) * Number(i.quantidade);
  });
  const topProdutos = Object.entries(prodMap)
    .sort(([,a], [,b]) => b.qty - a.qty)
    .slice(0, 10)
    .map(([nome, { qty, receita }]) => ({ nome, qty, receita }));

  // Por tipo
  const porTipo = { local: 0, delivery: 0, retirada: 0 };
  pedidosConcluidos.forEach(p => {
    if (p.tipo in porTipo) (porTipo as any)[p.tipo]++;
  });

  // Tempos médios
  const temposMedios = pedidosConcluidos
    .filter(p => p.tempo_preparo_minutos)
    .map(p => Number(p.tempo_preparo_minutos));
  const tempoMedio = temposMedios.length > 0
    ? Math.round(temposMedios.reduce((a, b) => a + b, 0) / temposMedios.length)
    : null;

  // Financeiro
  const receitas = (financeiro || []).filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0);
  const despesas = (financeiro || []).filter(m => m.tipo === 'despesa').reduce((s, m) => s + Number(m.valor), 0);

  return {
    totalFaturamento: pedidosConcluidos.reduce((s, p) => s + Number(p.total), 0),
    totalPedidos: pedidosConcluidos.length,
    pedidosCancelados: pedidosCancelados.length,
    ticketMedio: pedidosConcluidos.length > 0
      ? pedidosConcluidos.reduce((s, p) => s + Number(p.total), 0) / pedidosConcluidos.length : 0,
    vendasDia: Object.entries(vendasDia).map(([dia, total]) => ({ dia, total })),
    topProdutos,
    porTipo,
    tempoMedio,
    receitas, despesas,
    lucro: receitas - despesas,
  };
}

interface RelatoriosPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const params = await searchParams;
  const mes = params.mes || format(new Date(), 'yyyy-MM');
  const data = await getRelatorioData(mes);
  const maxVenda = Math.max(...data.vendasDia.map(v => v.total), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Relatórios</h1>
          <p className="text-zinc-500 mt-1">Análise de desempenho do mês</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <input type="month" name="mes" defaultValue={mes} className="border border-zinc-200 rounded-xl px-4 py-2 text-sm bg-white" />
          <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition">
            Filtrar
          </button>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faturamento', value: formatCurrency(data.totalFaturamento), sub: `${data.totalPedidos} pedidos`, icon: <ShoppingBag className="w-5 h-5" />, color: 'blue' },
          { label: 'Ticket Médio', value: formatCurrency(data.ticketMedio), sub: 'Por pedido', icon: <TrendingUp className="w-5 h-5" />, color: 'purple' },
          { label: 'Lucro Estimado', value: formatCurrency(data.lucro), sub: `R${formatCurrency(data.receitas)} - D${formatCurrency(data.despesas)}`, icon: <Star className="w-5 h-5" />, color: data.lucro >= 0 ? 'green' : 'red' },
          { label: 'Tempo Médio', value: data.tempoMedio ? `${data.tempoMedio} min` : 'N/A', sub: 'De preparo', icon: <Clock className="w-5 h-5" />, color: 'orange' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm text-zinc-500 font-medium">{kpi.label}</p>
              <div className={`p-2 rounded-xl 
                ${kpi.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  kpi.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                  kpi.color === 'green' ? 'bg-green-50 text-green-600' :
                  kpi.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                  'bg-red-50 text-red-600'}`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900">{kpi.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Faturamento Diário */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 mb-6">Faturamento por Dia</h2>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-40 min-w-[600px]">
              {data.vendasDia.map(({ dia, total }) => (
                <div key={dia} className="flex-1 flex flex-col items-center gap-1">
                  {total > 0 && <span className="text-[10px] text-zinc-500 font-medium">{formatCurrency(total).replace('R$\u00a0', '')}</span>}
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[var(--color-primary)] to-orange-400 min-h-[2px]"
                    style={{ height: `${Math.max(2, (total / maxVenda) * 120)}px` }}
                  />
                  <span className="text-[10px] font-medium text-zinc-400 rotate-45 origin-left whitespace-nowrap">{dia}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Por Tipo + Cancelados */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <h2 className="font-bold text-zinc-900 mb-4">Por Tipo de Pedido</h2>
            <div className="space-y-3">
              {[
                { label: 'Na Mesa / Local', count: data.porTipo.local, emoji: '🪑' },
                { label: 'Delivery', count: data.porTipo.delivery, emoji: '🛵' },
                { label: 'Retirada', count: data.porTipo.retirada, emoji: '🏃' },
              ].map(t => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">{t.emoji} {t.label}</span>
                  <span className="font-bold text-zinc-900">{t.count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <span className="text-sm text-red-500">❌ Cancelados</span>
                <span className="font-bold text-red-600">{data.pedidosCancelados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Produtos */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-zinc-500" />
          <h2 className="font-bold text-zinc-900">Top 10 Produtos do Mês</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="text-left px-4 py-3 text-zinc-600 font-semibold">#</th>
              <th className="text-left px-4 py-3 text-zinc-600 font-semibold">Produto</th>
              <th className="text-right px-4 py-3 text-zinc-600 font-semibold">Qtd Vendida</th>
              <th className="text-right px-4 py-3 text-zinc-600 font-semibold">Receita Gerada</th>
            </tr>
          </thead>
          <tbody>
            {data.topProdutos.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-zinc-400">Sem dados neste período</td></tr>
            ) : (
              data.topProdutos.map((p, i) => (
                <tr key={p.nome} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-black text-zinc-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-1.5 rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${(p.qty / data.topProdutos[0].qty) * 100}px` }}
                      />
                      {p.nome}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-700">{p.qty}x</td>
                  <td className="px-4 py-3 text-right font-black text-green-700">{formatCurrency(p.receita)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
