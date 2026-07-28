'use client';
import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useCMSStore } from '@/lib/store';
import { logAction } from '@/lib/audit';

export function useCMSSave() {
  const store = useCMSStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(
    async (
      table: string,
      id: string,
      field: string,
      value: unknown,
      entityNome?: string
    ) => {
      // 1. Optimistic Update (UI)
      // Usually done by the component holding the local state, but we flag as saving
      store.setSaving(true);

      // 2. Debounce the actual save to prevent spam
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      return new Promise<void>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            // Update Supabase
            const { error } = await supabase
              .from(table as any)
              .update({ [field]: value })
              .eq('id', id);

            if (error) throw error;

            // Log action
            await logAction({
              action: 'UPDATE',
              entity: table,
              entityId: id,
              entityNome: entityNome || field,
              diff: { [field]: value },
            });

            store.setLastSaved(new Date());
            resolve();
          } catch (e) {
            console.error('[CMS Save Error]:', e);
            reject(e);
          } finally {
            store.setSaving(false);
          }
        }, 500); // 500ms debounce
      });
    },
    [store]
  );

  return { save };
}
