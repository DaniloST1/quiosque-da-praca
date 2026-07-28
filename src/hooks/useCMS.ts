'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCMSStore } from '@/lib/store';

export function useCMS() {
  const store = useCMSStore();

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch role
        supabase
          .from('usuarios')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            store.setUser(session.user.id, data?.role ?? null);
          });
      } else {
        store.setUser(null, null);
        store.setEditMode(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', session.user.id)
            .single();
          store.setUser(session.user.id, data?.role ?? null);
        } else {
          store.setUser(null, null);
          store.setEditMode(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return store;
}
