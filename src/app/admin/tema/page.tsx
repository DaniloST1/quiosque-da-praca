'use client';
import { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Paintbrush, Save, RefreshCw, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ThemeValues {
  id: string;
  nome: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  cor_fundo: string;
  cor_texto: string;
  fonte_titulo: string;
  fonte_corpo: string;
}

const DEFAULT: Omit<ThemeValues, 'id' | 'nome'> = {
  cor_primaria: '#D97A1E',
  cor_secundaria: '#8B4A1D',
  cor_destaque: '#F4B400',
  cor_fundo: '#FFF8EE',
  cor_texto: '#2B2B2B',
  fonte_titulo: 'Outfit',
  fonte_corpo: 'Inter',
};

const FONT_OPTIONS = ['Inter', 'Outfit', 'Roboto', 'Poppins', 'Lato', 'Montserrat', 'Nunito', 'Raleway'];

const COLOR_FIELDS: { key: keyof typeof DEFAULT; label: string; description: string }[] = [
  { key: 'cor_primaria', label: 'Cor Primária', description: 'Cor principal da marca (botões, destaques)' },
  { key: 'cor_secundaria', label: 'Cor Secundária', description: 'Cor de suporte e hover' },
  { key: 'cor_destaque', label: 'Cor de Destaque', description: 'Badges e elementos de chamada' },
  { key: 'cor_fundo', label: 'Cor de Fundo', description: 'Fundo geral da página' },
  { key: 'cor_texto', label: 'Cor do Texto', description: 'Cor principal dos textos' },
];

export default function TemaPage() {
  const [theme, setTheme] = useState<ThemeValues | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    supabase
      .from('temas')
      .select('*')
      .eq('ativo', true)
      .single()
      .then(({ data }) => {
        if (data) setTheme(data as ThemeValues);
      });
  }, []);

  const handleChange = (field: keyof ThemeValues, value: string) => {
    if (!theme) return;
    const updated = { ...theme, [field]: value };
    setTheme(updated);
    // Apply preview in real-time
    const varMap: Partial<Record<keyof ThemeValues, string>> = {
      cor_primaria: '--color-primary',
      cor_secundaria: '--color-secondary',
      cor_destaque: '--color-accent',
      cor_fundo: '--color-bg',
      cor_texto: '--color-text',
    };
    const cssVar = varMap[field];
    if (cssVar) document.documentElement.style.setProperty(cssVar, value);
  };

  const handleSave = () => {
    if (!theme) return;
    startTransition(async () => {
      const { error } = await supabase
        .from('temas')
        .update({
          cor_primaria: theme.cor_primaria,
          cor_secundaria: theme.cor_secundaria,
          cor_destaque: theme.cor_destaque,
          cor_fundo: theme.cor_fundo,
          cor_texto: theme.cor_texto,
          fonte_titulo: theme.fonte_titulo,
          fonte_corpo: theme.fonte_corpo,
        })
        .eq('id', theme.id);
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const handleReset = () => {
    if (!theme) return;
    const reset = { ...theme, ...DEFAULT };
    setTheme(reset);
    Object.entries(DEFAULT).forEach(([key, val]) => {
      const varMap: Record<string, string> = {
        cor_primaria: '--color-primary',
        cor_secundaria: '--color-secondary',
        cor_destaque: '--color-accent',
        cor_fundo: '--color-bg',
        cor_texto: '--color-text',
      };
      if (varMap[key]) document.documentElement.style.setProperty(varMap[key], val);
    });
  };

  if (!theme) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2 flex items-center gap-3">
            <Paintbrush className="w-7 h-7 text-[var(--color-primary)]" />
            Editor de Tema
          </h1>
          <p className="text-zinc-500">As alterações de cor são aplicadas em tempo real como preview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Resetar
          </button>
          <button
            id="btn-tema-save"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-secondary)] disabled:opacity-60 transition-all"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isPending ? 'Salvando...' : 'Salvar Tema'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colors */}
        <Card className="p-6 shadow-sm border-none">
          <h2 className="text-lg font-bold text-zinc-900 mb-6">Paleta de Cores</h2>
          <div className="space-y-5">
            {COLOR_FIELDS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center gap-4">
                <label
                  htmlFor={`color-${key}`}
                  className="relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-2 border-zinc-200 hover:border-zinc-400 transition-all shadow-sm shrink-0"
                  style={{ backgroundColor: theme[key as keyof ThemeValues] as string }}
                >
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={theme[key as keyof ThemeValues] as string}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900 text-sm">{label}</p>
                  <p className="text-zinc-400 text-xs">{description}</p>
                </div>
                <code className="text-xs font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded">
                  {theme[key as keyof ThemeValues]}
                </code>
              </div>
            ))}
          </div>
        </Card>

        {/* Fonts & Preview */}
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-none">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Tipografia</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Fonte dos Títulos
                </label>
                <select
                  value={theme.fonte_titulo}
                  onChange={(e) => handleChange('fonte_titulo', e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Fonte do Corpo
                </label>
                <select
                  value={theme.fonte_corpo}
                  onChange={(e) => handleChange('fonte_corpo', e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Preview Card */}
          <Card className="p-6 shadow-sm border-none overflow-hidden">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Preview</h2>
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ backgroundColor: theme.cor_fundo, color: theme.cor_texto }}
            >
              <h3
                style={{ color: theme.cor_primaria, fontFamily: `'${theme.fonte_titulo}', sans-serif` }}
                className="text-xl font-black"
              >
                Quiosque da Praça
              </h3>
              <p style={{ fontFamily: `'${theme.fonte_corpo}', sans-serif` }} className="text-sm opacity-80">
                O sabor que reúne amigos e família em um ambiente descontraído.
              </p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <button
                  className="px-4 py-2 rounded-lg text-white text-xs font-bold"
                  style={{ backgroundColor: theme.cor_primaria }}
                >
                  Ver Cardápio
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-white text-xs font-bold"
                  style={{ backgroundColor: theme.cor_secundaria }}
                >
                  WhatsApp
                </button>
                <span
                  className="px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: theme.cor_destaque, color: '#111' }}
                >
                  Promoção!
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
