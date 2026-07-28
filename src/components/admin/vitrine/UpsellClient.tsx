'use client';

import { useState } from 'react';
import { salvarRelacionados, calcularUpsellAutomatico } from '@/app/admin/vitrine/produtos-relacionados/actions';
import { Save, Loader2, AlertCircle, ChevronDown, ChevronRight, Plus, X, RefreshCw } from 'lucide-react';

type Produto = { id: string; nome: string; categoria: any; preco: number };
type Relacionamento = { id: string; produto_base_id: string; produto_sugerido_id: string; sugerido?: { id: string; nome: string } };

export function UpsellClient({ 
  produtos,
  initialRelacionados
}: { 
  produtos: Produto[],
  initialRelacionados: Relacionamento[]
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [relacionados, setRelacionados] = useState<Relacionamento[]>(initialRelacionados);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const getSugeridosIds = (baseId: string) => {
    return relacionados.filter(r => r.produto_base_id === baseId).map(r => r.produto_sugerido_id);
  };

  const handleAdd = (baseId: string, sugeridoId: string) => {
    if (!sugeridoId) return;
    if (getSugeridosIds(baseId).includes(sugeridoId)) return;
    
    setRelacionados(prev => [
      ...prev, 
      { id: Math.random().toString(), produto_base_id: baseId, produto_sugerido_id: sugeridoId }
    ]);
  };

  const handleRemove = (baseId: string, sugeridoId: string) => {
    setRelacionados(prev => prev.filter(r => !(r.produto_base_id === baseId && r.produto_sugerido_id === sugeridoId)));
  };

  const handleSave = async (baseId: string) => {
    setSavingId(baseId);
    try {
      await salvarRelacionados(baseId, getSugeridosIds(baseId));
      alert('Atualizado com sucesso!');
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleCalculateAuto = async () => {
    setCalculating(true);
    try {
      const res = await calcularUpsellAutomatico();
      if (!res.success) {
        alert(res.message || 'Erro ao calcular upsell');
      } else {
        alert('Upsell automático calculado com sucesso! A página será atualizada.');
        window.location.reload();
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setCalculating(false);
    }
  };

  // Helper para extrair o nome da categoria (já que a query mudou para categoria:categorias(nome))
  const getCategoriaNome = (p: Produto) => typeof p.categoria === 'object' ? p.categoria?.nome : p.categoria;

  // Agrupando produtos por categoria
  const categorias = Array.from(new Set(produtos.map(getCategoriaNome))).filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Configuração de Upsell</h2>
          <p className="text-sm text-zinc-500 mt-1">Configure o que oferecer junto com cada produto.</p>
        </div>
        <button
          onClick={handleCalculateAuto}
          disabled={calculating}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Calcular Auto
        </button>
      </div>
      {categorias.map(cat => (
        <div key={cat} className="mb-4">
          <div className="px-6 py-3 bg-zinc-50 border-y border-zinc-200 font-semibold text-zinc-700 capitalize">
            {cat}
          </div>
          <div className="divide-y divide-zinc-100">
            {produtos.filter(p => getCategoriaNome(p) === cat).map(prod => {
              const isExpanded = expandedId === prod.id;
              const sugeridos = getSugeridosIds(prod.id);
              
              return (
                <div key={prod.id} className="flex flex-col">
                  {/* Header Row */}
                  <div 
                    className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : prod.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
                      <span className="font-medium text-zinc-900">{prod.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span>{sugeridos.length} sugestões</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-14 py-4 bg-blue-50/30 border-t border-zinc-100">
                      <p className="text-sm text-zinc-600 mb-4">Adicione produtos que os clientes geralmente pedem junto com <strong>{prod.nome}</strong>.</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <select 
                          className="flex-1 p-2 rounded-lg border border-zinc-300 text-sm focus:ring-[var(--color-primary)] outline-none"
                          onChange={(e) => {
                            handleAdd(prod.id, e.target.value);
                            e.target.value = ""; // reset
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>+ Adicionar sugestão...</option>
                          {produtos.filter(p => p.id !== prod.id).map(p => (
                            <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco.toFixed(2)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {sugeridos.length === 0 && <span className="text-sm text-zinc-400 italic">Nenhuma sugestão configurada.</span>}
                        {sugeridos.map(sId => {
                          const sProd = produtos.find(p => p.id === sId);
                          if (!sProd) return null;
                          return (
                            <div key={sId} className="flex items-center gap-1 bg-white border border-zinc-200 rounded-full px-3 py-1 text-sm text-zinc-700 shadow-sm">
                              {sProd.nome}
                              <button onClick={() => handleRemove(prod.id, sId)} className="ml-1 text-zinc-400 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleSave(prod.id)}
                        disabled={savingId === prod.id}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors"
                      >
                        {savingId === prod.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar sugestões para {prod.nome}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
