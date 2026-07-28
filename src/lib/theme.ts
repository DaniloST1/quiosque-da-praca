import { supabase } from './supabase';
import { Tema, Configuracoes } from '@/types/database';

const DEFAULT_THEME = {
  cor_primaria: '#D97A1E',
  cor_secundaria: '#8B4A1D',
  cor_destaque: '#F4B400',
  cor_fundo: '#FFF8EE',
  cor_texto: '#2B2B2B',
  fonte_titulo: 'Outfit',
  fonte_corpo: 'Inter',
};

export async function getActiveTheme(): Promise<Partial<Tema>> {
  try {
    const { data } = await supabase
      .from('temas')
      .select('*')
      .eq('ativo', true)
      .single();
    return data ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export async function getConfig(): Promise<Partial<Configuracoes>> {
  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('*')
      .single();
    return data ?? {};
  } catch {
    return {};
  }
}

export function buildThemeCSSVars(theme: Partial<Tema>): string {
  const t = { ...DEFAULT_THEME, ...theme };
  return `
    :root {
      --color-primary:   ${t.cor_primaria};
      --color-secondary: ${t.cor_secundaria};
      --color-accent:    ${t.cor_destaque};
      --color-bg:        ${t.cor_fundo};
      --color-text:      ${t.cor_texto};
      --font-heading:    '${t.fonte_titulo}', sans-serif;
      --font-body:       '${t.fonte_corpo}', sans-serif;
    }
  `.trim();
}
