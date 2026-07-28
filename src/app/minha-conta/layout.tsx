import React from 'react';
import { createAdminClient } from '@/lib/supabase';
import { getConfig } from '@/lib/theme';
import { Header } from '@/components/layout/Header';
import { StatusSection } from '@/components/sections/StatusSection';
import { MinhaContaSidebar } from '@/components/conta/MinhaContaSidebar';

export default async function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();
  const config = await getConfig();

  const { data: secoesData } = await supabase
    .from('secoes_site')
    .select('*')
    .order('ordem', { ascending: true });

  const secoesOrdenadas = (secoesData || []).sort((a: any, b: any) => (a.ordem ?? 99) - (b.ordem ?? 99));

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Header igual ao da landpage */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <StatusSection horarios={config.horarios || []} />
        <Header
          logoUrl={config.logo_principal || null}
          whatsapp={config.whatsapp_number || ''}
          configId={config.id}
          secoes={secoesOrdenadas}
          link_whatsapp_direto={config.link_whatsapp_direto}
        />
      </div>

      {/* Page Body (below fixed header) */}
      <div className="flex flex-1 pt-[var(--header-height,7.5rem)]">

        {/* Sidebar Desktop — dark, mesmo estilo do admin */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-64 shrink-0 bg-zinc-900 text-zinc-300 border-r-[6px] border-[var(--color-primary)] min-h-[calc(100vh-7.5rem)] sticky top-[7.5rem] self-start shadow-xl">
          <MinhaContaSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Nav */}
          <div className="lg:hidden mb-6">
            <MinhaContaSidebar mobile />
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
