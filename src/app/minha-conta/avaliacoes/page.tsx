'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, Send, CheckCircle2, Loader2, ChefHat, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Produto {
  id: string;
  nome: string;
  imagem: string | null;
  categoria_id: string | null;
}

interface Avaliacao {
  id: string;
  produto_nome: string | null;
  nota: number;
  texto: string;
  publicada: boolean;
  destaque_site: boolean;
  created_at: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              i <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-zinc-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function AvaliacoesClientePage() {
  const { cliente } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [produtoId, setProdutoId] = useState('');
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [cliente]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: prods }, { data: avs }] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, imagem, categoria_id')
        .eq('ativo', true)
        .order('nome'),
      cliente?.id
        ? supabase
            .from('avaliacoes')
            .select('id, produto_nome, nota, texto, publicada, destaque_site, created_at')
            .eq('cliente_id', cliente.id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    setProdutos(prods || []);
    setAvaliacoes((avs as Avaliacao[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente?.id || !nota) return;
    setSubmitting(true);

    const selectedProduto = produtos.find((p) => p.id === produtoId);
    const nomeProduto = selectedProduto?.nome || null;
    const nomeCliente = cliente.nome || 'Cliente';

    const { error } = await supabase.from('avaliacoes').insert({
      cliente_id: cliente.id,
      produto_nome: nomeProduto,
      nome: nomeCliente,
      texto: comentario,
      nota,
      publicada: false, // Aguarda moderação do admin
      destaque_site: false,
      ordem: 99,
    });

    setSubmitting(false);
    if (!error) {
      setSuccess(true);
      setComentario('');
      setProdutoId('');
      setNota(5);
      fetchData();
      setTimeout(() => setSuccess(false), 5000);
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const labelNota: Record<number, string> = {
    1: 'Muito ruim',
    2: 'Ruim',
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente!',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 font-heading">Minhas Avaliações</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Compartilhe sua experiência com nossos produtos. Suas avaliações nos ajudam a melhorar!
        </p>
      </div>

      {/* Formulário de avaliação */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900">Nova Avaliação</h2>
            <p className="text-xs text-zinc-500">Escolha um produto e deixe seu comentário</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Avaliação enviada! Ela será publicada após análise.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Busca + seleção de produto */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wide">
              Produto (opcional)
            </label>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setProdutoId('')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                  produtoId === ''
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                <ChefHat className="w-4 h-4 shrink-0" />
                <span className="truncate">Geral / Atendimento</span>
              </button>

              {produtosFiltrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProdutoId(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                    produtoId === p.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {p.imagem ? (
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-200 shrink-0" />
                  )}
                  <span className="truncate">{p.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-3 uppercase tracking-wide">
              Sua Nota
            </label>
            <div className="flex items-center gap-4">
              <StarPicker value={nota} onChange={setNota} />
              <span className="text-sm font-bold text-zinc-600">{labelNota[nota]}</span>
            </div>
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wide">
              Comentário *
            </label>
            <textarea
              required
              minLength={10}
              maxLength={500}
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte sua experiência com o produto ou atendimento..."
              className="w-full px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <p className="text-xs text-zinc-400 mt-1 text-right">{comentario.length}/500</p>
          </div>

          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </form>
      </div>

      {/* Histórico de avaliações */}
      {avaliacoes.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6">
          <h2 className="font-bold text-zinc-900 mb-4">Minhas Avaliações Anteriores</h2>
          <div className="space-y-4">
            {avaliacoes.map((av) => (
              <div
                key={av.id}
                className="flex gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50"
              >
                <div className="shrink-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i <= av.nota ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {av.produto_nome && (
                    <p className="text-xs font-bold text-[var(--color-primary)] mb-1">
                      {av.produto_nome}
                    </p>
                  )}
                  <p className="text-sm text-zinc-700">{av.texto}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-zinc-400">
                      {new Date(av.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        av.destaque_site
                          ? 'bg-yellow-100 text-yellow-700'
                          : av.publicada
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-200 text-zinc-500'
                      }`}
                    >
                      {av.destaque_site
                        ? '⭐ Destaque no site'
                        : av.publicada
                        ? '✓ Publicada'
                        : 'Aguardando análise'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
