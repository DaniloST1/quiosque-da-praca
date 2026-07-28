import { supabase } from './supabase';
import { logAction } from './audit';

export async function getRevisions(entity: string, entityId: string) {
  const { data } = await supabase
    .from('revisoes')
    .select('*')
    .eq('entity', entity)
    .eq('entity_id', entityId)
    .order('version', { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function restoreRevision(
  revisionId: string,
  entity: string
): Promise<void> {
  // 1. Fetch the revision snapshot
  const { data: revision, error } = await supabase
    .from('revisoes')
    .select('*')
    .eq('id', revisionId)
    .single();

  if (error || !revision) throw new Error('Revision not found');

  const snapshot = revision.snapshot as Record<string, unknown>;
  const entityId = revision.entity_id as string;

  // Remove metadata fields that shouldn't be restored
  const { id: _id, created_at: _ca, updated_at: _ua, ...restorable } = snapshot;
  void _id; void _ca; void _ua;

  // 2. Update the entity with the snapshot
  const { error: updateError } = await supabase
    .from(entity)
    .update(restorable)
    .eq('id', entityId);

  if (updateError) throw new Error(`Restore failed: ${updateError.message}`);

  // 3. Log the restore action
  await logAction({
    action: 'RESTORE',
    entity,
    entityId,
    entityNome: (snapshot.nome || snapshot.titulo) as string | undefined,
    diff: { restored_version: revision.version },
  });
}
