'use client';
import { useCMSStore } from '@/lib/store';
import { useCMS } from '@/hooks/useCMS';
import { Settings, LogOut, Loader2, Check, LayoutDashboard, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function CMSToolbar() {
  const store = useCMS();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    store.setUser(null, null);
    store.setEditMode(false);
    router.refresh();
  };

  // Not logged in: show a subtle admin login button
  if (!store.currentUserId) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Link
          href="/admin/login"
          className="flex items-center gap-1.5 bg-zinc-800/80 backdrop-blur-md text-zinc-400 hover:text-white text-xs px-3 py-2 rounded-full shadow-lg border border-zinc-700 transition-all hover:bg-zinc-800"
        >
          <LogIn className="w-3.5 h-3.5" />
          Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl border border-zinc-800">
      
      {/* Edit Mode Toggle */}
      <div className="flex items-center gap-2 border-r border-zinc-700 pr-4">
        <span className="text-sm font-medium">Modo de Edição</span>
        <button
          onClick={() => store.setEditMode(!store.isEditMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            store.isEditMode ? 'bg-green-500' : 'bg-zinc-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              store.isEditMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Save Status */}
      {store.isEditMode && (
        <div className="flex items-center gap-2 text-sm text-zinc-400 border-r border-zinc-700 pr-4">
          {store.isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Salvando...</span>
            </>
          ) : store.lastSaved ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span>Salvo {store.lastSaved.toLocaleTimeString()}</span>
            </>
          ) : (
            <span>Pronto para editar</span>
          )}
        </div>
      )}

      {/* Admin Panel Link */}
      <Link href="/admin" className="flex items-center gap-2 text-sm hover:text-[var(--color-accent)] transition-colors">
        <LayoutDashboard className="w-4 h-4" />
        <span className="hidden sm:inline">Painel</span>
      </Link>

      {/* Preview Site */}
      <a 
        href="/admin/preview"
        onClick={() => store.setEditMode(false)}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors pl-4 border-l border-zinc-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        <span className="hidden sm:inline">Visualizar Site</span>
      </a>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors pl-4 border-l border-zinc-700"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>

    </div>
  );
}
