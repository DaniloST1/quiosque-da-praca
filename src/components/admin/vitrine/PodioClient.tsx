'use client';

import { useState } from 'react';
import { salvarPodio, calcularPodioAutomatico } from '@/app/admin/vitrine/mais-pedidos/actions';
import { Trophy, Save, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

type Produto = { id: string; nome: string; categoria: string; preco: number };
type PodioItem = { id?: string; posicao: number; produto_id: string; modo: string; produto?: { nome: string } };

export function PodioClient({ 
  initialPodio, 
  produtos 
}: { 
  initialPodio: PodioItem[], 
  produtos: Produto[] 
}) {
  const [podio, setPodio] = useState<PodioItem[]>(() => {
    // Garante que existam 3 posições
    const result = [1, 2, 3].map(pos => {
      const existing = initialPodio.find(p => p.posicao === pos);
      return existing || { posicao: pos, produto_id: '', modo: 'manual' };
    });
    return result;
  });

  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSelect = (posicao: number, produto_id: string) => {
    setPodio(prev => prev.map(p => p.posicao === posicao ? { ...p, produto_id, modo: 'manual' } : p));
    setSuccess(false);
    setError('');
  };

  const handleSave = async () => {
    // Validar se todos foram preenchidos
    if (podio.some(p => !p.produto_id)) {
      setError('Por favor, selecione um produto para todas as 3 posições.');
      return;
    }
    
    // Validar se não tem produto repetido
    const ids = podio.map(p => p.produto_id);
    if (new Set(ids).size !== 3) {
      setError('Os produtos no pódio devem ser diferentes.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await salvarPodio(podio.map(p => ({
        posicao: p.posicao,
        produto_id: p.produto_id,
        modo: p.modo
      })));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getPositionColor = (pos: number) => {
    if (pos === 1) return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    if (pos === 2) return 'text-slate-400 bg-slate-50 border-slate-200';
    if (pos === 3) return 'text-amber-600 bg-amber-50 border-amber-200';
    return '';
  };

  const handleCalculateAuto = async () => {
    setCalculating(true);
    setError('');
    setSuccess(false);
    try {
      const res = await calcularPodioAutomatico();
      if (!res.success) {
        setError(res.message || 'Erro ao calcular pódio automático');
      } else {
        alert('Pódio automático calculado com sucesso! A página será atualizada.');
        window.location.reload();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Configurar Pódio
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Selecione manualmente ou calcule automaticamente.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCalculateAuto}
            disabled={calculating || saving}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Calcular Auto
          </button>
          <button
            onClick={handleSave}
            disabled={saving || calculating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Manual
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs">✓</div>
            <p className="text-sm font-medium">Pódio atualizado com sucesso!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((pos) => {
            const item = podio.find(p => p.posicao === pos)!;
            const style = getPositionColor(pos);
            
            return (
              <div key={pos} className={`rounded-xl border-2 p-6 flex flex-col gap-4 ${style}`}>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold opacity-80">{pos}º</span>
                  <Trophy className="w-8 h-8 opacity-80" />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2 opacity-90 text-zinc-800">
                    Selecione o Produto:
                  </label>
                  <select
                    value={item.produto_id}
                    onChange={(e) => handleSelect(pos, e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                  >
                    <option value="">-- Escolha um produto --</option>
                    {produtos.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nome} - R$ {prod.preco.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
