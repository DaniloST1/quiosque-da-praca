'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, GripVertical, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Secao {
  id: string;
  chave: string;
  nome: string;
  visivel: boolean;
  ordem: number;
}

const SECTION_ICONS: Record<string, string> = {
  hero: '🖼️',
  promocoes: '🏷️',
  mais_pedidos: '🏆',
  combos: '📦',
  cardapio: '🍽️',
  galeria: '📷',
  avaliacoes: '⭐',
  contato: '📞',
  mapa: '📍',
  montar_pedido: '🛒',
  rodape: '📄',
};

const DEFAULT_ORDER: Record<string, number> = {
  hero: 1,
  promocoes: 2,
  mais_pedidos: 3,
  cardapio: 4,
  combos: 5,
  montar_pedido: 6,
  galeria: 7,
  contato: 8,
  avaliacoes: 9,
  mapa: 10,
  rodape: 11,
};

// ── Item arrastável ──────────────────────────────────────────────────────────
function SortableSecaoItem({
  secao,
  saving,
  onToggle,
}: {
  secao: Secao;
  saving: string | null;
  onToggle: (secao: Secao) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: secao.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${secao.visivel
          ? 'bg-white border-zinc-200 hover:border-zinc-300'
          : 'bg-zinc-50 border-zinc-200 opacity-70'
        } ${isDragging ? 'shadow-xl' : ''}`}
    >
      {/* Handle de drag */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 transition-colors shrink-0 touch-none"
        title="Arrastar para reordenar"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="text-2xl shrink-0 w-8 text-center">
        {SECTION_ICONS[secao.chave] || '📄'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-900">{secao.nome}</p>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">
          chave: <span className="text-zinc-600">{secao.chave}</span>
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${secao.visivel
              ? 'bg-green-100 text-green-700'
              : 'bg-zinc-200 text-zinc-500'
            }`}
        >
          {secao.visivel ? 'Visível' : 'Oculto'}
        </span>

        <button
          onClick={() => onToggle(secao)}
          disabled={saving === secao.id}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] ${secao.visivel ? 'bg-[var(--color-primary)]' : 'bg-zinc-300'
            }`}
          title={secao.visivel ? 'Desativar seção' : 'Ativar seção'}
        >
          {saving === secao.id ? (
            <Loader2 className="w-4 h-4 text-white animate-spin mx-auto" />
          ) : (
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${secao.visivel ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          )}
        </button>

        <div className="w-5 flex justify-center">
          {secao.visivel ? (
            <Eye className="w-5 h-5 text-green-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function SecoesVisibilidadeClient({ secoes: initialSecoes }: { secoes: Secao[] }) {
  const [secoes, setSecoes] = useState<Secao[]>(initialSecoes);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [restoringOrder, setRestoringOrder] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleVisibilidade = async (secao: Secao) => {
    setSaving(secao.id);
    const novoValor = !secao.visivel;

    const { error } = await supabase
      .from('secoes_site')
      .update({ visivel: novoValor })
      .eq('id', secao.id);

    if (error) {
      alert('Erro ao atualizar: ' + error.message);
    } else {
      setSecoes((prev) =>
        prev.map((s) => (s.id === secao.id ? { ...s, visivel: novoValor } : s))
      );
      router.refresh();
    }

    setSaving(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = secoes.findIndex((s) => s.id === active.id);
    const newIndex = secoes.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(secoes, oldIndex, newIndex);

    // Atualiza UI imediatamente
    setSecoes(reordered);
    setSavingOrder(true);

    // Persiste no banco
    try {
      const updates = reordered.map((s, idx) =>
        supabase.from('secoes_site').update({ ordem: idx + 1 }).eq('id', s.id)
      );
      await Promise.all(updates);
      router.refresh();
    } catch (err) {
      alert('Erro ao salvar ordem: ' + err);
    } finally {
      setSavingOrder(false);
    }
  };

  const restaurarOrdemPadrao = async () => {
    if (!confirm('Restaurar a ordem padrão das seções?')) return;
    setRestoringOrder(true);

    try {
      const updates = secoes.map((s) =>
        supabase
          .from('secoes_site')
          .update({ ordem: DEFAULT_ORDER[s.chave] ?? 99 })
          .eq('id', s.id)
      );
      await Promise.all(updates);

      setSecoes((prev) =>
        [...prev].sort(
          (a, b) => (DEFAULT_ORDER[a.chave] ?? 99) - (DEFAULT_ORDER[b.chave] ?? 99)
        )
      );
      router.refresh();
    } catch (err) {
      alert('Erro ao restaurar ordem: ' + err);
    } finally {
      setRestoringOrder(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/vitrine"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Vitrine
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Visibilidade das Seções</h1>
            <p className="text-zinc-500 mt-1">
              Ative, desative e reordene cada bloco da página inicial. Arraste pelo ícone{' '}
              <span className="inline-flex items-center gap-0.5 font-mono text-zinc-600">☰</span>{' '}
              para reordenar.
            </p>
          </div>
          <button
            onClick={restaurarOrdemPadrao}
            disabled={restoringOrder}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            {restoringOrder ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Restaurar Ordem Padrão
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-amber-500 text-xl mt-0.5">ℹ️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Como funciona?</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Ao desativar uma seção, ela desaparece do site para os visitantes. A ordem aqui
            também controla a ordem do menu de navegação superior.
          </p>
        </div>
      </div>

      {savingOrder && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Salvando nova ordem...
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={secoes.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {secoes.map((secao) => (
              <SortableSecaoItem
                key={secao.id}
                secao={secao}
                saving={saving}
                onToggle={toggleVisibilidade}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {secoes.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg font-medium mb-2">Nenhuma seção encontrada</p>
          <p className="text-sm">
            Execute o script SQL de migração para criar a tabela <code>secoes_site</code> com a
            coluna <code>ordem</code>.
          </p>
        </div>
      )}
    </div>
  );
}
