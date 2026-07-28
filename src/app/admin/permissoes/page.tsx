'use client';
import { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Usuario, UserRole } from '@/types/database';
import { ShieldCheck, Check, X, Loader2, UserCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    description: 'Acesso total, inclui usuários e exportação',
  },
  admin: {
    label: 'Administrador',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    description: 'Gerencia todo o conteúdo, tema e SEO',
  },
  editor: {
    label: 'Editor',
    color: 'text-green-700',
    bg: 'bg-green-100',
    description: 'Edita produtos, banners, promoções e galeria',
  },
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateStr));
}

export default function PermissoesPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setUsuarios((data as Usuario[]) || []);
        setLoading(false);
      });
  }, []);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      setSaving(userId);
      const { error } = await supabase
        .from('usuarios')
        .update({ role: newRole })
        .eq('id', userId);

      if (!error) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
      setSaving(null);
    });
  };

  const handleToggleAtivo = (userId: string, currentAtivo: boolean) => {
    startTransition(async () => {
      setSaving(userId);
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !currentAtivo })
        .eq('id', userId);

      if (!error) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ativo: !currentAtivo } : u))
        );
      }
      setSaving(null);
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2 flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-[var(--color-primary)]" />
          Gerenciamento de Usuários
        </h1>
        <p className="text-zinc-500">Gerencie os acessos e permissões dos administradores do sistema.</p>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <Card key={role} className="p-4 border-none shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{config.description}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : usuarios.length === 0 ? (
        <Card className="p-12 text-center border-none shadow-sm">
          <UserCircle className="w-12 h-12 mx-auto text-zinc-200 mb-3" />
          <p className="text-zinc-500 font-medium">Nenhum usuário cadastrado</p>
          <p className="text-zinc-400 text-sm mt-1">
            Usuários são criados quando alguém se autentica pelo Supabase.
          </p>
        </Card>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {usuarios.map((user) => {
              const roleConf = ROLE_CONFIG[user.role];
              const isSavingThis = saving === user.id;

              return (
                <div
                  key={user.id}
                  className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                    !user.ativo ? 'opacity-50 bg-zinc-50' : 'hover:bg-zinc-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.nome || user.email} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <UserCircle className="w-7 h-7" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 text-sm truncate">
                      {user.nome || user.email}
                    </p>
                    {user.nome && (
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    )}
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Desde {formatDate(user.created_at)}
                    </p>
                  </div>

                  {/* Role Selector */}
                  <div className="shrink-0">
                    <select
                      id={`role-${user.id}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      disabled={isSavingThis || isPending}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                        roleConf.bg
                      } ${roleConf.color}`}
                    >
                      {Object.entries(ROLE_CONFIG).map(([r, c]) => (
                        <option key={r} value={r}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleAtivo(user.id, user.ativo)}
                    disabled={isSavingThis || isPending}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                      user.ativo
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-green-100 hover:text-green-700'
                    }`}
                    title={user.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                  >
                    {isSavingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : user.ativo ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
