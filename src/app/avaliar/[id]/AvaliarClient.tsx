'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Star, Loader2 } from 'lucide-react';

interface ProdutoMini {
  produto_id: string;
  nome: string;
}

interface AvaliarClientProps {
  pedidoId: string;
  produtos: ProdutoMini[];
}

export default function AvaliarClient({ pedidoId, produtos }: AvaliarClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State maps produto_id -> { nota, comentario }
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { nota: number; comentario: string }>>(
    produtos.reduce((acc, p) => ({ ...acc, [p.produto_id]: { nota: 5, comentario: '' } }), {})
  );

  const setNota = (produtoId: string, nota: number) => {
    setAvaliacoes(prev => ({
      ...prev,
      [produtoId]: { ...prev[produtoId], nota }
    }));
  };

  const setComentario = (produtoId: string, comentario: string) => {
    setAvaliacoes(prev => ({
      ...prev,
      [produtoId]: { ...prev[produtoId], comentario }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // Prepare insertions
      const inserts = produtos.map(p => ({
        pedido_id: pedidoId,
        produto_id: p.produto_id,
        nota: avaliacoes[p.produto_id].nota,
        comentario: avaliacoes[p.produto_id].comentario
      }));

      // Insert all
      const { error: insertError } = await supabase.from('produto_avaliacoes').insert(inserts);
      if (insertError) throw insertError;

      // Mark order as reviewed
      const { error: updateError } = await supabase.from('pedidos').update({ avaliado: true }).eq('id', pedidoId);
      if (updateError) throw updateError;

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Avaliações enviadas com sucesso!</h2>
        <p className="text-zinc-500 mt-2">Agradecemos pelo seu tempo. Volte sempre!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {produtos.map(p => (
        <div key={p.produto_id} className="bg-zinc-50 border border-zinc-100 rounded-xl p-5">
          <p className="font-bold text-lg text-zinc-800 mb-3">{p.nome}</p>
          
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNota(p.produto_id, star)}
                className={`p-1 transition-colors ${
                  star <= avaliacoes[p.produto_id].nota ? 'text-yellow-400' : 'text-zinc-300 hover:text-yellow-200'
                }`}
              >
                <Star className="w-8 h-8 fill-current" />
              </button>
            ))}
          </div>

          <textarea
            className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            rows={3}
            placeholder="O que achou deste item? (Opcional)"
            value={avaliacoes[p.produto_id].comentario}
            onChange={(e) => setComentario(p.produto_id, e.target.value)}
          />
        </div>
      ))}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-12 text-base font-bold shadow-md rounded-xl"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar Avaliações'}
      </Button>
    </div>
  );
}
