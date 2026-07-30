import Link from 'next/link';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { Configuracoes } from '@/types/database';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditableHours } from '@/components/cms/EditableHours';

interface Secao {
  chave: string;
  nome: string;
  visivel: boolean;
  ordem: number;
}

interface FooterProps {
  config: Partial<Configuracoes>;
  secoes?: Secao[];
}

// Mapa de chave da seção → item do menu
const SECTION_NAV: Record<string, { label: string; href: string }> = {
  hero:          { label: 'Início',        href: '#inicio' },
  promocoes:     { label: 'Promoções',     href: '#promocoes' },
  mais_pedidos:  { label: 'Mais Pedidos',  href: '#mais-pedidos' },
  cardapio:      { label: 'Cardápio',      href: '#cardapio' },
  combos:        { label: 'Combos',        href: '#combos' },
  montar_pedido: { label: 'Montar Pedido', href: '#montar-pedido' },
  galeria:       { label: 'Galeria',       href: '#galeria' },
  contato:       { label: 'Sobre',         href: '#sobre' },
  avaliacoes:    { label: 'Avaliações',    href: '#avaliacoes' },
  mapa:          { label: 'Localização',   href: '#localizacao' },
};

export function Footer({ config, secoes = [] }: FooterProps) {
  const navLinks = secoes.length > 0
    ? secoes
        .filter((s) => s.visivel !== false && s.chave in SECTION_NAV)
        .map((s) => SECTION_NAV[s.chave])
    : [
        { label: 'Início',        href: '#inicio' },
        { label: 'Promoções',     href: '#promocoes' },
        { label: 'Cardápio',      href: '#cardapio' },
        { label: 'Combos',        href: '#combos' },
        { label: 'Montar Pedido', href: '#montar-pedido' },
        { label: 'Sobre',         href: '#sobre' },
        { label: 'Avaliações',    href: '#avaliacoes' },
        { label: 'Localização',   href: '#localizacao' },
      ];

  return (
    <footer className="bg-zinc-900 text-zinc-300 pt-16 pb-8 border-t-[8px] border-[var(--color-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            {config.id ? (
              <a href="#inicio" className="flex items-center md:items-start justify-center md:justify-start">
                <EditableImage
                  src={config.logo_escuro || config.logo_principal || null}
                  table="configuracoes"
                  field="logo_escuro"
                  id={config.id}
                  bucket="logos"
                  className="flex items-center md:items-start justify-center md:justify-start"
                >
                  {config.logo_escuro || config.logo_principal ? (
                    <img src={config.logo_escuro || config.logo_principal || undefined} alt="Logo" className="h-10 w-auto object-contain cursor-pointer opacity-80 hover:opacity-100 transition-opacity" />
                  ) : (
                    <h3 className="text-3xl font-black text-white font-heading cursor-pointer border border-dashed border-transparent hover:border-white p-1 rounded-sm">
                      {config.nome_empresa || 'Quiosque'}
                      <span className="text-[var(--color-primary)]">.</span>
                    </h3>
                  )}
                </EditableImage>
              </a>
            ) : (
              config.logo_escuro || config.logo_principal ? (
                <img src={config.logo_escuro || config.logo_principal || undefined} alt="Logo" className="h-14 object-contain" />
              ) : (
                <h3 className="text-3xl font-black text-white font-heading">
                  {config.nome_empresa || 'Quiosque'}
                  <span className="text-[var(--color-primary)]">.</span>
                </h3>
              )
            )}
            <p className="text-sm text-zinc-400 max-w-xs">
              O sabor que reúne amigos e família em um ambiente descontraído.
            </p>
            <div className="flex flex-col items-center md:items-start gap-2 pt-2">
              {config.instagram_handle && (
                <a href={`https://instagram.com/${config.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Instagram
                </a>
              )}
              {config.facebook_url && (
                <a href={config.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Facebook
                </a>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h4 className="text-white font-bold text-lg font-heading">Contato</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              <li className="flex flex-col sm:flex-row items-center md:items-start gap-2 sm:gap-3 text-center md:text-left">
                <MapPin className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                <span>
                  {config.id ? (
                    <>
                      <EditableText text={config.endereco || 'Endereço não informado'} table="configuracoes" field="endereco" id={config.id} as="div" /><br />
                      <EditableText text={config.cidade || ''} table="configuracoes" field="cidade" id={config.id} as="div" />
                    </>
                  ) : (
                    <>{config.endereco || 'Endereço não informado'}<br />{config.cidade || ''}</>
                  )}
                </span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                <Phone className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                <span>
                  {config.id ? (
                    <EditableText text={config.whatsapp_number || ''} table="configuracoes" field="whatsapp_number" id={config.id} />
                  ) : (
                    config.whatsapp_number?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
                  )}
                </span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h4 className="text-white font-bold text-lg font-heading">Horários</h4>
            {config.id ? (
              <EditableHours
                horarios={config.horarios as any}
                table="configuracoes"
                field="horarios"
                id={config.id}
              />
            ) : (
              <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
                {config.horarios?.map((h: any, i: number) => (
                  <li key={i} className="flex flex-col sm:flex-row items-center md:items-start gap-1 sm:gap-3 text-center md:text-left">
                    <Clock className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                    <div>
                      <span className="block font-medium capitalize text-zinc-200">
                        {h.dias.join(', ')}
                      </span>
                      <span className="text-zinc-400">
                        {h.abertura} às {h.fechamento}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Links */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h4 className="text-white font-bold text-lg font-heading">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-center md:text-left">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
              {config.ifood_url && (
                <li className="pt-2">
                  <a href={config.ifood_url} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:text-white font-bold transition-colors">
                    Pedir pelo iFood &rarr;
                  </a>
                </li>
              )}
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-zinc-800 text-center text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} {config.nome_empresa}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
