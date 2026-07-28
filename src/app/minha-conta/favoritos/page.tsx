'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FavoritoItem {
  id: string;
  produto: {
    id: string;
    nome: string;
    descricao: string;
    preco: number;
    imagem_url: string | null;
  };
}

export default function FavoritosPage() {
  const { cliente } = useAuth();
  const cart = useCart();
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoritos = async () => {
    const clienteId = cliente?.id;
    if (!clienteId) return;
    setLoading(true);
    const { data } = await supabase
      .from('cliente_favoritos')
      .select('id, produto:produtos(*)')
      .eq('cliente_id', clienteId);

    if (data) {
      setFavoritos(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFavoritos();
  }, [cliente?.id]);

  const handleRemove = async (favId: string) => {
    await supabase.from('cliente_favoritos').delete().eq('id', favId);
    fetchFavoritos();
  };

  const handleAddToCart = (produto: any) => {
    cart.addItem(produto);
    cart.openCart();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 font-heading">Meus Favoritos</h1>
        <p className="text-xs text-zinc-500 mt-1">Seus pratos favoritos salvos para pedir com facilidade.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-xs py-8 text-center">Carregando favoritos...</div>
      ) : favoritos.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-zinc-200">
          <Heart className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700">Nenhum favorito salvo</p>
          <p className="text-xs text-zinc-400 mt-1">Clique no ícone de coração nos produtos para salvar seus favoritos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoritos.map((fav) => (
            <div key={fav.id} className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-zinc-900 text-sm">{fav.produto.nome}</h3>
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                    title="Remover dos favoritos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{fav.produto.descricao}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <span className="font-bold text-sm text-[var(--color-primary)]">
                  {formatCurrency(fav.produto.preco)}
                </span>
                <Button size="sm" onClick={() => handleAddToCart(fav.produto)} className="gap-1.5 text-xs py-1 px-3">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Pedir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
