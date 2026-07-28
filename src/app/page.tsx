import { createAdminClient } from '@/lib/supabase';
import { getConfig } from '@/lib/theme';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { StatusSection } from '@/components/sections/StatusSection';
import { PromotionsSection } from '@/components/sections/PromotionsSection';
import { BestSellersSection } from '@/components/sections/BestSellersSection';
import { MenuSection } from '@/components/sections/MenuSection';
import { CombosSection } from '@/components/sections/CombosSection';
import { OrderBuilder } from '@/components/sections/OrderBuilder';
import { GallerySection } from '@/components/sections/GallerySection';
import { AboutSection } from '@/components/sections/AboutSection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { LocationSection } from '@/components/sections/LocationSection';
import { SectionVisibilityToggle } from '@/components/cms/SectionVisibilityToggle';

export const revalidate = 0;

export default async function Home() {
  const supabase = createAdminClient();
  const config = await getConfig();
  const cookieStore = await cookies();
  const isEditMode = cookieStore.get('is_edit_mode')?.value === 'true';

  // Fetch all necessary data
  const [
    { data: banners },
    { data: promocoes },
    { data: categorias },
    { data: produtos },
    { data: combos },
    { data: galeria },
    { data: avaliacoes },
    { data: mais_pedidos },
    { data: secoesData },
  ] = await Promise.all([
    supabase.from('banners').select('*').eq('ativo', true).order('ordem'),
    supabase.from('promocoes').select('*').eq('ativa', true).order('ordem'),
    supabase.from('categorias').select('*').eq('ativa', true).order('ordem'),
    supabase.from('produtos').select('*, categoria:categoria_id(slug), imagens:produto_imagens(*)').eq('ativo', true).order('ordem'),
    supabase.from('combos').select('*').eq('ativo', true).order('ordem'),
    supabase.from('galeria').select('*').eq('ativo', true).order('ordem'),
    supabase.from('avaliacoes').select('*').eq('publicada', true).order('ordem'),
    supabase.from('mais_pedidos').select('produto_id, posicao').order('posicao'),
    supabase.from('secoes_site').select('*').order('ordem', { ascending: true }),
  ]);

  const podioIds = (mais_pedidos || []).sort((a, b) => a.posicao - b.posicao).map((p) => p.produto_id);
  const bestSellers = podioIds
    .map((id) => produtos?.find((p) => p.id === id))
    .filter(Boolean) as any[];

  // Seções ordenadas do banco — ordem ASC, depois filtra visível
  const secoesOrdenadas = (secoesData || []).sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

  // Mapa de seções visíveis para lookup rápido
  const secaoVisivel = (chave: string) => {
    const s = secoesOrdenadas.find((s) => s.chave === chave);
    return s ? s.visivel !== false : true;
  };

  // ── sectionMap: componentes pré-montados com os dados corretos ──────────────
  const sectionMap: Record<string, React.ReactNode> = {
    hero: (
      <HeroSection
        banners={banners || []}
        whatsappUrl={config.whatsapp_number ? `https://wa.me/${config.whatsapp_number}` : undefined}
        whatsappNumber={config.whatsapp_number || ''}
        ifoodUrl={config.ifood_url || undefined}
        link_whatsapp_direto={config.link_whatsapp_direto}
      />
    ),
    promocoes: <PromotionsSection promocoes={promocoes || []} />,
    mais_pedidos: <BestSellersSection bestSellers={bestSellers} />,
    cardapio: <MenuSection categorias={categorias || []} produtos={produtos || []} />,
    combos: <CombosSection combos={combos || []} />,
    montar_pedido: <OrderBuilder produtos={produtos || []} whatsappNumber={config.whatsapp_number || ''} />,
    galeria: <GallerySection items={galeria || []} />,
    contato: <AboutSection />,
    avaliacoes: <ReviewsSection avaliacoes={avaliacoes || []} />,
    mapa: (
      <LocationSection
        endereco={config.endereco || null}
        cidade={config.cidade || null}
        embedUrl={config.google_maps_embed_url || null}
      />
    ),
  };

  // Seções que têm nome no menu (rodape e header são tratados à parte)
  const SECTION_NAMES: Record<string, string> = {
    hero: 'Hero Banners',
    promocoes: 'Promoções',
    mais_pedidos: 'Mais Pedidos',
    cardapio: 'Cardápio Completo',
    combos: 'Combos Especiais',
    montar_pedido: 'Montar Pedido',
    galeria: 'Galeria de Fotos',
    contato: 'Sobre/Contato',
    avaliacoes: 'Avaliações',
    mapa: 'Localização / Mapa',
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StatusSection horarios={config.horarios || []} />
        <div className="relative">
          <SectionVisibilityToggle
            sectionKey="header"
            sectionName="Header"
            isVisible={secaoVisivel('header')}
            isEditMode={isEditMode}
          >
            <Header
              logoUrl={config.logo_principal || null}
              whatsapp={config.whatsapp_number || ''}
              configId={config.id}
              secoes={secoesOrdenadas}
              link_whatsapp_direto={config.link_whatsapp_direto}
            />
          </SectionVisibilityToggle>
        </div>
      </div>

      <main className="flex-1 pt-[123px]">

        {/* Renderiza seções na ordem do banco */}
        {secoesOrdenadas
          .filter((s) => s.chave in sectionMap)
          .map((secao) => (
            <div key={secao.chave} className="relative">
              <SectionVisibilityToggle
                sectionKey={secao.chave}
                sectionName={SECTION_NAMES[secao.chave] || secao.nome || secao.chave}
                isVisible={secao.visivel !== false}
                isEditMode={isEditMode}
              >
                {sectionMap[secao.chave]}
              </SectionVisibilityToggle>
            </div>
          ))}
      </main>

      <div className="relative">
        <SectionVisibilityToggle
          sectionKey="rodape"
          sectionName="Rodapé"
          isVisible={secaoVisivel('rodape')}
          isEditMode={isEditMode}
        >
          <Footer config={config} secoes={secoesOrdenadas} />
        </SectionVisibilityToggle>
      </div>
    </>
  );
}
