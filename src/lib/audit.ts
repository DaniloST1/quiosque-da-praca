import { supabase } from './supabase';
import { AuditAction } from '@/types/database';

interface LogActionParams {
  action: AuditAction;
  entity: string;
  entityId?: string;
  entityNome?: string;
  diff?: Record<string, unknown>;
}

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile } = user
      ? await supabase.from('usuarios').select('role').eq('id', user.id).single()
      : { data: null };

    await supabase.from('activity_logs').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_role: userProfile?.role ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      entity_nome: params.entityNome ?? null,
      diff: params.diff ?? null,
    });
  } catch (e) {
    // Audit log failures must not break the main operation
    console.error('[Audit] Failed to log action:', e);
  }
}

export async function getRecentLogs(limit = 10) {
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
