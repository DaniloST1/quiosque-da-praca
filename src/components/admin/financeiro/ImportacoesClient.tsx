'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, AlertTriangle, ArrowRight, Save, X } from 'lucide-react';
import Papa from 'papaparse';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface Regra {
  id: string; palavra: string; categoria_id: string | null; tipo: 'receita'|'despesa';
  categoria?: { nome: string; cor: string };
}

interface LinhaCSV {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'receita'|'despesa';
  categoria_id: string | null;
  categoria_nome?: string;
  metodo: string;
  selecionado: boolean;
}

export function ImportacoesClient() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [linhas, setLinhas] = useState<LinhaCSV[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDados = async () => {
      const [{ data: r }, { data: c }] = await Promise.all([
        supabase.from('importacao_regras').select('*, categoria:financeiro_categorias(nome, cor)'),
        supabase.from('financeiro_categorias').select('*').eq('ativa', true)
      ]);
      if (r) setRegras(r as any);
      if (c) setCategorias(c);
      setLoading(false);
    };
    fetchDados();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => {
          // Tentar adivinhar as colunas comuns de bancos
          const data = row.Data || row.date || row.DATA || '';
          const descricao = row.Descricao || row.Descrição || row.description || row.Historico || '';
          const valorStr = row.Valor || row.amount || row.VALOR || '0';
          
          // Converter "R$ -1.450,00" ou "-1450.00" para number
          const numStr = String(valorStr).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
          const valorReal = parseFloat(numStr) || 0;
          
          const tipo: "receita" | "despesa" = valorReal >= 0 ? 'receita' : 'despesa';
          const absValor = Math.abs(valorReal);

          // Classificar usando regras
          let catId = null;
          let catNome = '';
          const upperDesc = descricao.toUpperCase();

          for (const regra of regras) {
            if (upperDesc.includes(regra.palavra.toUpperCase()) && regra.tipo === tipo) {
              catId = regra.categoria_id;
              catNome = regra.categoria?.nome || '';
              break;
            }
          }

          // Format date from DD/MM/YYYY to YYYY-MM-DD
          let dataFormatada = data;
          if (data.includes('/')) {
            const [d, m, y] = data.split('/');
            if (y && y.length === 4) dataFormatada = `${y}-${m}-${d}`;
          }

          return {
            id: crypto.randomUUID(),
            data: dataFormatada,
            descricao,
            valor: absValor,
            tipo,
            categoria_id: catId,
            categoria_nome: catNome,
            metodo: 'outros',
            selecionado: true
          };
        });
        setLinhas(parsed);
      }
    });
  };

  const salvarImportacao = async () => {
    const ativos = linhas.filter(l => l.selecionado);
    if (ativos.length === 0) return alert('Nenhuma linha selecionada');
    setSaving(true);

    const payload = ativos.map(l => ({
      data: l.data,
      descricao: l.descricao,
      valor: l.valor,
      tipo: l.tipo,
      categoria_id: l.categoria_id,
      metodo: l.metodo,
      observacoes: 'Importado via CSV'
    }));

    const { error } = await supabase.from('financeiro_movimentacoes').insert(payload);
    if (error) {
      alert('Erro ao importar: ' + error.message);
    } else {
      alert(`${ativos.length} movimentações importadas com sucesso!`);
      setLinhas([]);
    }
    setSaving(false);
  };

  if (loading) return <p className="p-8 text-zinc-400 text-center">Carregando módulo...</p>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Importação de Extrato</h1>
          <p className="text-zinc-500 mt-1">Importe arquivos CSV do seu banco e classifique automaticamente.</p>
        </div>
      </div>

      {/* Upload Box */}
      {linhas.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-[var(--color-primary)] hover:bg-zinc-50 transition"
        >
          <Upload className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900">Clique para enviar seu extrato bancário (CSV)</h3>
          <p className="text-zinc-500 mt-2 text-sm">O arquivo deve conter as colunas: Data, Descrição, Valor</p>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-900 text-white p-4 rounded-xl">
            <div>
              <p className="font-bold">Revisão de Importação</p>
              <p className="text-sm opacity-80">{linhas.filter(l => l.selecionado).length} de {linhas.length} linhas selecionadas</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setLinhas([])} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-700">Cancelar</button>
              <button onClick={salvarImportacao} disabled={saving} className="px-4 py-2 bg-[var(--color-primary)] rounded-lg text-sm font-bold flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Confirmar Importação'}
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input type="checkbox" checked={linhas.every(l => l.selecionado)} onChange={e => setLinhas(linhas.map(l => ({ ...l, selecionado: e.target.checked })))} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Descrição Original</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Categoria (Automática/Manual)</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600">Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, idx) => (
                  <tr key={linha.id} className={`border-b border-zinc-100 ${!linha.selecionado ? 'opacity-40 bg-zinc-50' : 'hover:bg-blue-50/30'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={linha.selecionado} onChange={e => setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, selecionado: e.target.checked } : l))} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="date" value={linha.data} onChange={e => setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, data: e.target.value } : l))} className="border rounded px-2 py-1 text-xs w-28 bg-transparent" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={linha.descricao} onChange={e => setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, descricao: e.target.value } : l))} className="border border-transparent hover:border-zinc-300 rounded px-2 py-1 w-full bg-transparent font-medium text-zinc-900" />
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={linha.categoria_id || ''} 
                        onChange={e => setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, categoria_id: e.target.value || null } : l))}
                        className={`border rounded px-2 py-1 text-xs w-full ${!linha.categoria_id ? 'border-amber-400 bg-amber-50' : 'bg-green-50 border-green-200'}`}
                      >
                        <option value="">Sem categoria (selecione...)</option>
                        {categorias.filter(c => c.tipo === linha.tipo).map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${linha.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                        {linha.tipo === 'receita' ? '+' : '-'}{formatCurrency(linha.valor)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regras e Dicas */}
      {linhas.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-zinc-900">Como funciona o aprendizado?</h3>
            </div>
            <p className="text-sm text-zinc-600">O sistema lê a descrição do extrato (ex: "PIX RECEBIDO IFOOD") e associa a uma Categoria usando as "Regras" cadastradas. Palavras-chave garantem que você não precise classificar a mesma conta todo mês.</p>
          </div>
          
          <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm h-64 overflow-y-auto">
            <h3 className="font-bold text-zinc-900 mb-3">Suas Regras Ativas ({regras.length})</h3>
            {regras.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhuma regra cadastrada via banco de dados.</p>
            ) : (
              <div className="space-y-2">
                {regras.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="font-medium text-zinc-700">"{r.palavra}"</span>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                    <span className="bg-zinc-100 px-2 py-1 rounded text-xs">{r.categoria?.nome || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
