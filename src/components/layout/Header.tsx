'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { EditableImage } from '@/components/cms/EditableImage';
import { UserMenu } from '@/components/layout/UserMenu';

interface Secao {
  chave: string;
  nome: string;
  visivel: boolean;
  ordem: number;
}

interface HeaderProps {
  logoUrl: string | null;
  whatsapp: string;
  configId?: string;
  secoes?: Secao[];
  link_whatsapp_direto?: boolean;
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

export function Header({ logoUrl, whatsapp, configId, secoes = [], link_whatsapp_direto = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cart = useCart();
  const itemCount = cart.items.reduce((total, item) => total + item.quantidade, 0);

  // Gera navLinks dinamicamente a partir das seções ordenadas e visíveis do banco
  const navLinks: Array<{ label: string; href?: string; onClick?: () => void }> = secoes.length > 0
    ? secoes
        .filter((s) => s.visivel !== false && s.chave in SECTION_NAV)
        .map((s) => SECTION_NAV[s.chave])
    : [
        // fallback estático caso secoes não seja fornecido
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
    <header className="w-full z-40 relative bg-zinc-900 text-zinc-300 border-b-[6px] border-[var(--color-primary)] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {configId ? (
              <a href="#inicio" className="flex items-center">
                <EditableImage
                  src={logoUrl}
                  table="configuracoes"
                  field="logo_principal"
                  id={configId}
                  bucket="logos"
                  className="flex items-center"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain cursor-pointer" />
                  ) : (
                    <span className="text-2xl font-black text-[var(--color-primary)] font-heading cursor-pointer border border-dashed border-transparent hover:border-[var(--color-primary)] p-1 rounded-sm">
                      Quiosque<span className="text-[var(--color-accent)]">.</span>
                    </span>
                  )}
                </EditableImage>
              </a>
            ) : (
              <Link href="/">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <span className="text-2xl font-black text-[var(--color-primary)] font-heading">
                    Quiosque<span className="text-[var(--color-accent)]">.</span>
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-4">
            {navLinks.map((link) =>
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="text-sm font-semibold text-zinc-300 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-zinc-300 hover:text-[var(--color-primary)] transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <UserMenu />

            <button
              onClick={cart.openCart}
              className="relative p-2 text-zinc-300 hover:text-[var(--color-primary)] transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/4 -translate-y-1/4">
                  {itemCount}
                </span>
              )}
            </button>

            {link_whatsapp_direto ? (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:block"
              >
                <Button size="sm">Pedir no WhatsApp</Button>
              </a>
            ) : (
              <Button size="sm" className="hidden md:block" onClick={() => cart.openCart()}>
                Fazer Pedido
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              className="xl:hidden p-2 text-zinc-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="xl:hidden bg-zinc-800 border-b-[4px] border-[var(--color-primary)] max-h-[80vh] overflow-y-auto">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) =>
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={() => {
                    link.onClick!();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 rounded-md text-base font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-[var(--color-primary)]"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-3 py-3 rounded-md text-base font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-[var(--color-primary)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="pt-4 px-3">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full"
              >
                <Button className="w-full">Pedir no WhatsApp</Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
