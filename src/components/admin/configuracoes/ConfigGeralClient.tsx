'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, MapPin } from 'lucide-react';

export function ConfigGeralClient() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('configuracoes').select('*').single().then(({ data }) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('configuracoes').update({
        endereco: config.endereco,
        cidade: config.cidade,
        google_maps_embed_url: config.google_maps_embed_url,
        whatsapp_number: config.whatsapp_number,
        link_whatsapp_direto: config.link_whatsapp_direto
      }).eq('id', config.id);
      
      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-zinc-500">Carregando...</div>;
  if (!config) return <div className="p-6 text-center text-zinc-500">Erro ao carregar configurações.</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Endereço (Rua, Número, Bairro)</label>
          <input 
            type="text" 
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            value={config.endereco || ''} 
            onChange={e => setConfig({...config, endereco: e.target.value})}
            placeholder="Ex: R. Jose Pereira Dos Santos, 275"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Cidade e Estado</label>
          <input 
            type="text" 
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            value={config.cidade || ''} 
            onChange={e => setConfig({...config, cidade: e.target.value})}
            placeholder="Ex: Campinas - SP"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Número do WhatsApp</label>
          <input 
            type="text" 
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            value={config.whatsapp_number || ''} 
            onChange={e => setConfig({...config, whatsapp_number: e.target.value})}
            placeholder="Ex: 5519999999999"
          />
        </div>
        
        <div className="space-y-2 flex flex-col justify-center">
          <label className="flex items-center gap-2 cursor-pointer mt-6">
            <input 
              type="checkbox" 
              checked={config.link_whatsapp_direto ?? false} 
              onChange={e => setConfig({...config, link_whatsapp_direto: e.target.checked})}
              className="accent-[var(--color-primary)] w-4 h-4"
            />
            <span className="text-sm font-medium text-zinc-700">Link Direto no Topo (Ir p/ Chat em vez do Carrinho)</span>
          </label>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Link de Incorporação (Embed) do Google Maps</label>
          <p className="text-xs text-zinc-500">
            No Google Maps, clique em "Compartilhar" &gt; "Incorporar um mapa" e copie o link dentro do "src=..." (apenas a URL).
          </p>
          <input 
            type="text" 
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            value={config.google_maps_embed_url || ''} 
            onChange={e => setConfig({...config, google_maps_embed_url: e.target.value})}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </div>
      </div>

      {config.google_maps_embed_url && (
        <div className="w-full h-[300px] rounded-xl overflow-hidden border border-zinc-200">
          <iframe 
            src={config.google_maps_embed_url} 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
          />
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white font-bold rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
