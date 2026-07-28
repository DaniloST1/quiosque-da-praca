'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info, Percent, AlertTriangle, Filter, DollarSign } from 'lucide-react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface Lucratividade {
  produto_id: string;
  nome: string;
  categoria_nome: string;
  preco_venda: number;
  custo_producao: number;
  lucro_bruto: number;
  margem_percentual: number;
  quantidade_vendida?: number;
  lucro_total_periodo?: number;
}

export function LucratividadeClient() {
  const [itens, setItens] = useState<Lucratividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Lucratividade>('margem_percentual');
  const [sortAsc, setSortAsc] = useState(false);
  const [periodo, setPeriodo] = useState('mes'); // 'hoje', 'semana', 'mes', 'todos'

  const fetchLucratividade = async () => {
    setLoading(true);
    // Busca a view estática
    const { data: viewData } = await supabase.from('view_lucratividade').select('*');
    
    // Calcula o range de datas
    let dateFrom = new Date(0); // todos
    const now = new Date();
    if (periodo === 'hoje') dateFrom = startOfDay(now);
    if (periodo === 'semana') dateFrom = subDays(now, 7);
    if (periodo === 'mes') dateFrom = subDays(now, 30);

    // Busca vendas do período
    let query = supabase.from('pedido_itens').select('produto_id, quantidade, pedido:pedidos!inner(created_at, status)');
    if (periodo !== 'todos') {
      query = query.gte('pedidos.created_at', dateFrom.toISOString());
    }
    const { data: vendas } = await query;

    // Agrupa vendas por produto
    const vendasMap: Record<string, number> = {};
    if (vendas) {
      vendas.forEach((v: any) => {
        // Apenas pedidos não cancelados
        if (v.pedido?.status !== 'cancelado') {
          vendasMap[v.produto_id] = (vendasMap[v.produto_id] || 0) + v.quantidade;
        }
      });
    }

    if (viewData) {
      const enriched = viewData.map((v: any) => ({
        ...v,
        quantidade_vendida: vendasMap[v.produto_id] || 0,
        lucro_total_periodo: (vendasMap[v.produto_id] || 0) * v.lucro_bruto
      }));
      setItens(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLucratividade(); }, [periodo]);

  const handleSort = (field: keyof Lucratividade) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sortedItens = [...itens].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const margemMedia = itens.length > 0
    ? itens.reduce((s, i) => s + Number(i.margem_percentual), 0) / itens.length
    : 0;

  const produtosAbaixo = itens.filter(i => i.margem_percentual < 30); // ex: meta 30%

  const lucroTotal = itens.reduce((s, i) => s + (i.lucro_total_periodo || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Lucratividade por Produto</h1>
          <p className="text-zinc-500 mt-1">Margem de lucro calculada com base na ficha técnica</p>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="bg-transparent text-sm font-medium outline-none">
            <option value="hoje">Vendas de Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Últimos 30 dias</option>
            <option value="todos">Todo o período</option>
          </select>
        </div>
      </div>

      {/* Alerta */}
      {produtosAbaixo.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Atenção às Margens Baixas</p>
            <p className="text-amber-700 text-sm mt-1">
              Existem {produtosAbaixo.length} produtos com margem de lucro menor que 30%. É recomendável revisar a precificação ou o custo da ficha técnica desses itens.
            </p>
          </div>
        </div>
      )}

      {/* Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Margem Média Geral</p>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-500" />
            <p className="text-2xl font-black text-zinc-900">{margemMedia.toFixed(2)}%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Maior Margem (Campeão)</p>
          {itens.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-2xl font-black text-green-600">
                {Math.max(...itens.map(i => i.margem_percentual)).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Menor Margem</p>
          {itens.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <p className="text-2xl font-black text-red-600">
                {Math.min(...itens.map(i => i.margem_percentual)).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Lucro Bruto Total (Período)</p>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(lucroTotal)}</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50">
          <Info className="w-4 h-4 text-zinc-400" />
          <p className="text-xs text-zinc-500">
            <strong>Dica:</strong> Produtos com "Custo Zero" não possuem Ficha Técnica cadastrada. O Lucro Total reflete a quantidade vendida no período selecionado.
          </p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('nome')}>
                Produto {sortField === 'nome' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('categoria_nome')}>
                Categoria {sortField === 'categoria_nome' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('quantidade_vendida')}>
                Qtd. {sortField === 'quantidade_vendida' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600 hidden md:table-cell cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('custo_producao')}>
                Custo/Unid {sortField === 'custo_producao' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600 hidden md:table-cell cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('preco_venda')}>
                Preço {sortField === 'preco_venda' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('lucro_total_periodo')}>
                Lucro Total {sortField === 'lucro_total_periodo' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('margem_percentual')}>
                Margem Unid. {sortField === 'margem_percentual' && (sortAsc ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-400">Calculando margens...</td></tr>
            ) : sortedItens.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-400">Nenhum produto cadastrado.</td></tr>
            ) : (
              sortedItens.map(item => {
                const alerta = item.margem_percentual < 30;
                return (
                  <tr key={item.produto_id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition ${alerta && item.custo_producao > 0 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 font-bold text-zinc-900">{item.nome}</td>
                    <td className="px-4 py-3 text-zinc-500">{item.categoria_nome || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--color-primary)]">{item.quantidade_vendida || 0}x</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {item.custo_producao > 0 ? (
                        <span className="text-zinc-600">{formatCurrency(item.custo_producao)}</span>
                      ) : (
                        <span className="text-xs text-zinc-400 border border-dashed border-zinc-300 px-2 py-0.5 rounded">S/ Ficha</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 hidden md:table-cell">{formatCurrency(item.preco_venda)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${item.lucro_bruto > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(item.lucro_total_periodo || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden hidden md:block">
                          <div 
                            className={`h-full rounded-full ${item.margem_percentual >= 50 ? 'bg-green-500' : item.margem_percentual >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.max(item.margem_percentual, 0), 100)}%` }}
                          />
                        </div>
                        <span className={`font-black w-14 ${item.margem_percentual >= 50 ? 'text-green-700' : item.margem_percentual >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Number(item.margem_percentual).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
