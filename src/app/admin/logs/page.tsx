import { createAdminClient } from '@/lib/supabase';
import { ActivityLog } from '@/types/database';
import { History, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const revalidate = 0;

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  RESTORE: 'bg-purple-100 text-purple-700',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criado',
  UPDATE: 'Atualizado',
  DELETE: 'Excluído',
  RESTORE: 'Restaurado',
};

const ENTITY_LABELS: Record<string, string> = {
  produtos: 'Produto',
  categorias: 'Categoria',
  banners: 'Banner',
  combos: 'Combo',
  promocoes: 'Promoção',
  avaliacoes: 'Avaliação',
  galeria: 'Galeria',
  configuracoes: 'Configurações',
  temas: 'Tema',
  seo: 'SEO',
  paginas: 'Página',
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export default async function LogsPage() {
  const supabase = createAdminClient();
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const typedLogs: ActivityLog[] = (logs as ActivityLog[]) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2 flex items-center gap-3">
          <History className="w-7 h-7 text-[var(--color-primary)]" />
          Auditoria & Logs
        </h1>
        <p className="text-zinc-500">Registro completo de todas as ações realizadas no sistema.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(ACTION_LABELS).map(([action, label]) => {
          const count = typedLogs.filter((l) => l.action === action).length;
          return (
            <Card key={action} className="p-4 shadow-sm border-none text-center">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${ACTION_COLORS[action]}`}>
                {label}
              </span>
              <p className="text-2xl font-black text-zinc-900">{count}</p>
              <p className="text-xs text-zinc-400">últimas 100</p>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-100">
          <Filter className="w-4 h-4 text-zinc-400" />
          <h2 className="font-bold text-zinc-900">Histórico de Atividades</h2>
          <span className="ml-auto text-xs text-zinc-400">{typedLogs.length} registros</span>
        </div>

        {typedLogs.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma atividade registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {typedLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-zinc-50 transition-colors flex items-start gap-4">
                {/* Action Badge */}
                <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${ACTION_COLORS[log.action] || 'bg-zinc-100 text-zinc-600'}`}>
                  {ACTION_LABELS[log.action] || log.action}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900">
                    <span className="font-semibold">
                      {ENTITY_LABELS[log.entity] || log.entity}
                    </span>
                    {log.entity_nome && (
                      <span className="text-zinc-500"> — {log.entity_nome}</span>
                    )}
                  </p>
                  {log.user_email && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      por <span className="font-medium">{log.user_email}</span>
                      {log.user_role && <span className="ml-1 text-zinc-300">({log.user_role})</span>}
                    </p>
                  )}
                  {/* Diff preview */}
                  {log.diff && Object.keys(log.diff).length > 0 && (
                    <div className="mt-2 text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2 font-mono line-clamp-2">
                      {JSON.stringify(log.diff).slice(0, 200)}
                    </div>
                  )}
                </div>

                {/* Time */}
                <span className="shrink-0 text-xs text-zinc-400 whitespace-nowrap">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
