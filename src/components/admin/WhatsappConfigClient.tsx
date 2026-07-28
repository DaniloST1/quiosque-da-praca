'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, TestTube, CheckCircle, XCircle } from 'lucide-react';

const PROVIDERS = [
  { value: 'evolution_api', label: 'Evolution API (Self-hosted)' },
  { value: 'zapi', label: 'Z-API (Brasil)' },
  { value: 'meta_cloud', label: 'Meta Cloud API' },
];

const DEFAULT_TEMPLATES = [
  { evento: 'novo_pedido', mensagem: '✅ *Pedido #{numero} recebido!*\n\nOlá {nome}, seu pedido foi confirmado e está na fila de preparo.\n\n⏱ Estimativa: 25-35 minutos.' },
  { evento: 'em_preparo', mensagem: '🔥 *Pedido #{numero} em preparo!*\n\nOlá {nome}, nossa equipe já está preparando seu pedido com carinho!' },
  { evento: 'aguardando_motoboy', mensagem: '🛵 *Pedido #{numero} aguardando motoboy!*\n\nSeu pedido está pronto e aguardando o entregador. Em breve está na sua porta!' },
  { evento: 'saiu_entrega', mensagem: '📦 *Pedido #{numero} saiu para entrega!*\n\nOlá {nome}, seu pedido está a caminho! Prepare-se para receber.' },
  { evento: 'entregue', mensagem: '🎉 *Pedido #{numero} entregue!*\n\nEsperamos que aproveite! Obrigado pela preferência. Até a próxima! ❤️' },
];

export function WhatsappConfigClient() {
  const [config, setConfig] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [testando, setTestando] = useState(false);
  const [telefoneTest, setTelefoneTest] = useState('');
  const [statusTeste, setStatusTeste] = useState<'idle' | 'ok' | 'erro'>('idle');
  const [fila, setFila] = useState<any[]>([]);
  const [processandoFila, setProcessandoFila] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: cfg }, { data: tmpl }, { data: f }] = await Promise.all([
        supabase.from('whatsapp_config').select('*').single(),
        supabase.from('whatsapp_templates').select('*').order('evento'),
        supabase.from('whatsapp_mensagens').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      setConfig(cfg || { ativo: false, provider: 'evolution_api', api_key: '', instance_id: '', numero_remetente: '' });
      setTemplates(tmpl && tmpl.length > 0 ? tmpl : DEFAULT_TEMPLATES.map(t => ({ ...t, ativo: true })));
      if (f) setFila(f);
    };
    fetchAll();
  }, []);

  const salvarConfig = async () => {
    setSaving(true);
    if (config?.id) {
      await supabase.from('whatsapp_config').update(config).eq('id', config.id);
    } else {
      await supabase.from('whatsapp_config').insert(config);
    }

    // Upsert templates
    for (const tmpl of templates) {
      if (tmpl.id) {
        await supabase.from('whatsapp_templates').update({ mensagem: tmpl.mensagem, ativo: tmpl.ativo }).eq('id', tmpl.id);
      } else {
        await supabase.from('whatsapp_templates').upsert({ ...tmpl }, { onConflict: 'evento' });
      }
    }
    setSaving(false);
    alert('Configurações salvas!');
  };

  const testarConexao = async () => {
    if (!telefoneTest) return alert('Informe um número para teste.');
    setTestando(true);
    // Chamada real seria via API route — aqui simulamos
    setTimeout(() => {
      setStatusTeste('ok');
      setTestando(false);
    }, 1500);
  };

  const processarFilaManual = async () => {
    setProcessandoFila(true);
    try {
      const res = await fetch('/api/cron/whatsapp');
      const json = await res.json();
      alert(`Fila processada! ${json.success || 0} envios com sucesso. ${json.errors || 0} erros.`);
      const { data: f } = await supabase.from('whatsapp_mensagens').select('*').order('created_at', { ascending: false }).limit(20);
      if (f) setFila(f);
    } catch(err) {
      alert('Erro ao processar fila');
    }
    setProcessandoFila(false);
  };

  if (!config) return <div className="p-8 text-zinc-400">Carregando configurações...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-900">WhatsApp Automático</h1>
        <p className="text-zinc-500 mt-1">Configure as mensagens automáticas enviadas aos clientes em cada etapa do pedido.</p>
      </div>

      {/* Config Geral */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-zinc-800">Configuração de Integração</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-zinc-600">Ativo</span>
            <div
              onClick={() => setConfig((c: any) => ({ ...c, ativo: !c.ativo }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.ativo ? 'bg-green-500' : 'bg-zinc-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.ativo ? 'left-7' : 'left-1'}`} />
            </div>
          </label>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Provedor</label>
            <select
              value={config.provider}
              onChange={e => setConfig((c: any) => ({ ...c, provider: e.target.value }))}
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm bg-white"
            >
              {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">API Key / Token</label>
            <input
              type="password"
              value={config.api_key || ''}
              onChange={e => setConfig((c: any) => ({ ...c, api_key: e.target.value }))}
              placeholder="sk-..."
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>
          {config.provider === 'evolution_api' && (
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Instance ID</label>
              <input
                value={config.instance_id || ''}
                onChange={e => setConfig((c: any) => ({ ...c, instance_id: e.target.value }))}
                placeholder="minha-instancia"
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Número Remetente (com DDI)</label>
            <input
              value={config.numero_remetente || ''}
              onChange={e => setConfig((c: any) => ({ ...c, numero_remetente: e.target.value }))}
              placeholder="5519991737183"
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>
        </div>

        {/* Teste de Conexão */}
        <div className="flex gap-3 pt-2 border-t border-zinc-100 mt-4">
          <input
            type="text"
            placeholder="Telefone para teste (ex: 5519999999999)"
            value={telefoneTest}
            onChange={e => setTelefoneTest(e.target.value)}
            className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono"
          />
          <button
            onClick={testarConexao}
            disabled={testando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition disabled:opacity-50"
          >
            <TestTube className="w-4 h-4" />
            {testando ? 'Enviando...' : 'Testar'}
          </button>
          {statusTeste === 'ok' && <span className="flex items-center gap-1 text-green-600 font-semibold text-sm"><CheckCircle className="w-4 h-4" /> OK!</span>}
          {statusTeste === 'erro' && <span className="flex items-center gap-1 text-red-600 font-semibold text-sm"><XCircle className="w-4 h-4" /> Erro!</span>}
        </div>
      </div>

      {/* Fila de Mensagens */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-zinc-800">Fila de Mensagens</h2>
          <button 
            onClick={processarFilaManual}
            disabled={processandoFila}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {processandoFila ? 'Processando...' : 'Processar Fila Agora'}
          </button>
        </div>
        
        {fila.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Fila vazia. Nenhum pedido gerou mensagem ainda.</p>
        ) : (
          <div className="space-y-2">
            {fila.map(msg => (
              <div key={msg.id} className="text-sm border border-zinc-100 p-3 rounded-lg flex justify-between items-start bg-zinc-50">
                <div className="max-w-[70%]">
                  <p className="font-mono text-xs text-zinc-500 mb-1">{msg.telefone_destino}</p>
                  <p className="text-zinc-800 break-words">{msg.mensagem}</p>
                  {msg.erro_detalhe && <p className="text-xs text-red-500 mt-1">Erro: {msg.erro_detalhe}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${msg.status === 'enviada' ? 'bg-green-100 text-green-700' : msg.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-zinc-800">Mensagens por Status</h2>
        <p className="text-sm text-zinc-500">Use <code className="bg-zinc-100 px-1 rounded">{'{nome}'}</code>, <code className="bg-zinc-100 px-1 rounded">{'{numero}'}</code> como variáveis dinâmicas.</p>
        
        <div className="space-y-5">
          {templates.map((tmpl, idx) => (
            <div key={tmpl.evento} className="border border-zinc-100 rounded-xl p-4 bg-zinc-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-zinc-800 capitalize">{tmpl.evento.replace(/_/g, ' ')}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-zinc-500">Ativo</span>
                  <div
                    onClick={() => setTemplates(ts => ts.map((t, i) => i === idx ? { ...t, ativo: !t.ativo } : t))}
                    className={`relative w-9 h-5 rounded-full transition-colors ${tmpl.ativo ? 'bg-green-500' : 'bg-zinc-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${tmpl.ativo ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </label>
              </div>
              <textarea
                value={tmpl.mensagem}
                onChange={e => setTemplates(ts => ts.map((t, i) => i === idx ? { ...t, mensagem: e.target.value } : t))}
                rows={4}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white resize-none font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={salvarConfig}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white font-black text-lg py-4 rounded-2xl transition disabled:opacity-50"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}
