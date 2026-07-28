'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  produtoId: string;
  className?: string;
}

export function FavoriteButton({ produtoId, className = '' }: FavoriteButtonProps) {
  const { user, cliente, openAuthModal } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cliente?.id) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      const { data } = await supabase
        .from('cliente_favoritos')
        .select('id')
        .eq('cliente_id', cliente.id)
        .eq('produto_id', produtoId)
        .single();

      setIsFavorite(!!data);
    };

    checkFavorite();
  }, [cliente?.id, produtoId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user || !cliente?.id) {
      openAuthModal('login');
      return;
    }

    setLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from('cliente_favoritos')
        .delete()
        .eq('cliente_id', cliente.id)
        .eq('produto_id', produtoId);

      if (!error) setIsFavorite(false);
    } else {
      const { error } = await supabase
        .from('cliente_favoritos')
        .insert({
          cliente_id: cliente.id,
          produto_id: produtoId,
        });

      if (!error) setIsFavorite(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
        isFavorite
          ? 'text-red-500 bg-red-50 hover:bg-red-100'
          : 'text-zinc-400 bg-zinc-100 hover:text-red-500 hover:bg-zinc-200'
      } ${className}`}
      title={isFavorite ? 'Remover dos favoritos' : 'Favoritar produto'}
    >
      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
}
