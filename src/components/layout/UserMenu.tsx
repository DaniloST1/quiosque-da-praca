'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { User, LogIn } from 'lucide-react';

export function UserMenu() {
  const { user, cliente, openAuthModal } = useAuth();

  if (!user) {
    return (
      <button
        onClick={() => openAuthModal('login')}
        className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-200 hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer border border-zinc-700"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Entrar</span>
      </button>
    );
  }

  // Gera inicial do nome como fallback
  const nomeExibicao = cliente?.nome || user.email?.split('@')[0] || 'Cliente';
  const iniciais = nomeExibicao
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const avatarUrl = cliente?.foto_url || user.user_metadata?.avatar_url;

  return (
    <Link
      href="/minha-conta"
      className="flex items-center gap-2.5 p-1 rounded-full hover:bg-zinc-800 transition-colors group cursor-pointer"
      title="Minha Conta"
    >
      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--color-primary)] flex items-center justify-center bg-zinc-800 text-white font-bold text-xs shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={nomeExibicao} className="w-full h-full object-cover" />
        ) : (
          <span>{iniciais}</span>
        )}
      </div>
      <span className="hidden md:inline text-xs font-semibold text-zinc-200 group-hover:text-[var(--color-primary)] max-w-[100px] truncate">
        {nomeExibicao.split(' ')[0]}
      </span>
    </Link>
  );
}
