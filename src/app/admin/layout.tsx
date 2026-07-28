import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { LogOut, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already protects /admin/* routes — here we just read the user for display
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If no user, just render children (middleware already redirected away from protected routes)
  // This layout will only wrap /admin/login as a passthrough when user is null
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-300 border-r-[6px] border-[var(--color-primary)] flex-col hidden md:flex shrink-0 shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-zinc-800 shrink-0">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold">Voltar ao Site</span>
          </Link>
        </div>

        <div className="px-4 py-4 border-b border-zinc-800 shrink-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 mb-1">Painel</p>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <span className="text-[var(--color-primary)] text-xs font-bold">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-300 truncate">{user.email}</p>
              <p className="text-xs text-zinc-500">Administrador</p>
            </div>
          </div>
        </div>

        <nav id="admin-sidebar-nav" className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <AdminSidebarNav />
        </nav>

        <div className="p-4 border-t border-zinc-800 shrink-0">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-50 relative">
        {children}
      </main>
    </div>
  );
}
