'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  Heart,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const NAV_ITEMS = [
  { href: '/minha-conta',           label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/minha-conta/pedidos',   label: 'Meus Pedidos', icon: ShoppingBag },
  { href: '/minha-conta/enderecos', label: 'Endereços',    icon: MapPin },
  { href: '/minha-conta/favoritos', label: 'Favoritos',    icon: Heart },
  { href: '/minha-conta/perfil',    label: 'Meu Perfil',   icon: User },
];

interface MinhaContaSidebarProps {
  mobile?: boolean;
}

export function MinhaContaSidebar({ mobile = false }: MinhaContaSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { cliente, user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/minha-conta') return pathname === '/minha-conta';
    return pathname.startsWith(href);
  };

  // Iniciais do nome para o avatar
  const initials = cliente?.nome
    ? cliente.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() ?? 'C';

  const displayName = cliente?.nome || user?.email || 'Cliente';
  const fotoUrl = cliente?.foto_url || null;

  /* ── MOBILE: abas horizontais ─────────────────────────────────── */
  if (mobile) {
    return (
      <nav className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-colors border ${
              isActive(href)
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 border bg-white text-red-500 border-zinc-200 hover:border-red-300 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </nav>
    );
  }

  /* ── DESKTOP: sidebar estilo painel admin ─────────────────────── */
  return (
    <div className="flex flex-col h-full">

      {/* Voltar ao site */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-800 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="font-semibold">Voltar ao Site</span>
        </Link>
      </div>

      {/* Card do usuário */}
      <div className="px-4 py-4 border-b border-zinc-800 shrink-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 mb-2">
          Minha Conta
        </p>
        <div className="flex items-center gap-3 px-2">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0 overflow-hidden border border-[var(--color-primary)]/30">
            {fotoUrl ? (
              <Image src={fotoUrl} alt={displayName} width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <span className="text-[var(--color-primary)] text-xs font-bold">{initials}</span>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-200 truncate">{displayName}</p>
            <p className="text-xs text-zinc-500">Cliente</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
              isActive(href)
                ? 'bg-[var(--color-primary)] text-white shadow'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Icon
              className={`w-5 h-5 shrink-0 transition-colors ${
                isActive(href) ? 'text-white' : 'text-zinc-500 group-hover:text-white'
              }`}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Botão Sair */}
      <div className="p-4 border-t border-zinc-800 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
