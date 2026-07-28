'use client';
import { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { restoreRevision } from '@/lib/revisions';
import { Revisao } from '@/types/database';
import { Database, ChevronDown, ChevronRight, RotateCcw, Eye, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const ENTITIES = [
  { key: 'produtos', label: 'Produtos' },
  { key: 'banners', label: 'Banners' },
  { key: 'promocoes', label: 'Promoções' },
  { key: 'paginas', label: 'Páginas' },
];

interface RevisaoWithMeta extends Revisao {
  entity_display?: string;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function BackupsPage() {
  const [selectedEntity, setSelectedEntity] = useState('produtos');
  const [revisoes, setRevisoes] = useState<RevisaoWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, startRestore] = useTransition();
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [groupByItem, setGroupByItem] = useState<Record<string, RevisaoWithMeta[]>>({});

  useEffect(() => {
    setLoading(true);
    supabase
      .from('revisoes')
      .select('*')
      .eq('entity', selectedEntity)
      .order('version', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const list = (data as RevisaoWithMeta[]) || [];
        setRevisoes(list);

        // Group by entity_id
        const grouped: Record<string, RevisaoWithMeta[]> = {};
        list.forEach((r) => {
          if (!grouped[r.entity_id]) grouped[r.entity_id] = [];
          grouped[r.entity_id].push(r);
        });
        setGroupByItem(grouped);
        setLoading(false);
      });
  }, [selectedEntity]);

  const handleRestore = (revisionId: string) => {
    startRestore(async () => {
      try {
        await restoreRevision(revisionId, selectedEntity);
        setRestoredId(revisionId);
        setTimeout(() => setRestoredId(null), 3000);
      } catch (e) {
        alert(`Erro ao restaurar: ${e}`);
      }
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2 flex items-center gap-3">
          <Database className="w-7 h-7 text-[var(--color-primary)]" />
          Revisões & Backups
        </h1>
        <p className="text-zinc-500">
          O sistema salva automaticamente até 20 revisões por item antes de qualquer alteração.
        </p>
      </div>

      {/* Entity Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ENTITIES.map((ent) => (
          <button
            key={ent.key}
            onClick={() => setSelectedEntity(ent.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedEntity === ent.key
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {ent.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : Object.keys(groupByItem).length === 0 ? (
        <Card className="p-12 text-center border-none shadow-sm">
          <Database className="w-12 h-12 mx-auto text-zinc-200 mb-3" />
          <p className="text-zinc-500 font-medium">Nenhuma revisão encontrada</p>
          <p className="text-zinc-400 text-sm mt-1">
            Revisões são criadas automaticamente ao editar ou excluir itens.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupByItem).map(([entityId, revList]) => {
            const latest = revList[0];
            const snapshot = latest.snapshot as Record<string, unknown>;
            const displayName = (snapshot.nome || snapshot.titulo || entityId.slice(0, 8)) as string;
            const isOpen = expanded === entityId;

            return (
              <Card key={entityId} className="border-none shadow-sm overflow-hidden">
                {/* Item Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : entityId)}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-zinc-50 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900">{displayName}</p>
                    <p className="text-xs text-zinc-400">
                      {revList.length} revisão(ões) disponíveis • Última: {formatDate(latest.created_at)}
                    </p>
                  </div>
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">
                    v{latest.version}
                  </span>
                </button>

                {/* Revisions List */}
                {isOpen && (
                  <div className="border-t border-zinc-100 divide-y divide-zinc-50">
                    {revList.map((rev) => {
                      const snap = rev.snapshot as Record<string, unknown>;
                      const revName = (snap.nome || snap.titulo || 'Item') as string;

                      return (
                        <div key={rev.id} className="px-6 py-4 flex items-start gap-4 bg-zinc-50/50">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                            v{rev.version}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900">{revName}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{formatDate(rev.created_at)}</p>
                            {/* Snapshot preview */}
                            <details className="mt-2 group">
                              <summary className="flex items-center gap-1 text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 list-none">
                                <Eye className="w-3 h-3" />
                                Ver snapshot
                              </summary>
                              <pre className="mt-2 text-xs font-mono text-zinc-500 bg-white rounded-lg p-3 overflow-x-auto max-h-40 border border-zinc-100">
                                {JSON.stringify(rev.snapshot, null, 2)}
                              </pre>
                            </details>
                          </div>
                          <button
                            onClick={() => handleRestore(rev.id)}
                            disabled={restoring}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              restoredId === rev.id
                                ? 'bg-green-100 text-green-700'
                                : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                            } disabled:opacity-50`}
                          >
                            {restoring ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            {restoredId === rev.id ? 'Restaurado!' : 'Restaurar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
