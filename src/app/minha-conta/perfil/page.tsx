'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { formatPhoneBR } from '@/lib/phoneUtils';
import { User, Phone, Mail, Camera, Lock } from 'lucide-react';

export default function PerfilPage() {
  const { user, cliente, refreshCliente } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [nome, setNome] = useState(cliente?.nome || '');
  const [telefone, setTelefone] = useState(formatPhoneBR(cliente?.telefone || ''));
  const [fotoUrl, setFotoUrl] = useState(cliente?.foto_url || '');

  // Password state
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [senhaLoading, setSenhaLoading] = useState(false);
  const [senhaMsg, setSenhaMsg] = useState('');

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente?.id) return;
    setLoading(true);
    setMsg('');

    const telNorm = telefone.replace(/\D/g, '');

    const { error } = await supabase
      .from('clientes')
      .update({
        nome,
        telefone,
        telefone_normalizado: telNorm,
        foto_url: fotoUrl,
      })
      .eq('id', cliente.id);

    setLoading(false);
    if (error) {
      setMsg('Erro ao atualizar perfil: ' + error.message);
    } else {
      setMsg('Perfil atualizado com sucesso!');
      refreshCliente();
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmSenha) {
      setSenhaMsg('As senhas não coincidem.');
      return;
    }
    setSenhaLoading(true);
    setSenhaMsg('');

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setSenhaLoading(false);
    if (error) {
      setSenhaMsg('Erro ao alterar senha: ' + error.message);
    } else {
      setSenhaMsg('Senha alterada com sucesso!');
      setNovaSenha('');
      setConfirmSenha('');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* Dados do Perfil */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-2xs space-y-6">
        <h1 className="text-xl font-bold text-zinc-900 font-heading">Meu Perfil</h1>

        {msg && (
          <div className="p-3 rounded-lg bg-orange-50 text-[var(--color-primary)] text-xs border border-orange-100 font-medium">
            {msg}
          </div>
        )}

        <form onSubmit={handleSavePerfil} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">URL da Foto de Perfil</label>
            <div className="relative">
              <Camera className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="url"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Nome Completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                placeholder="(11) 9 9999-9999"
                maxLength={16}
                inputMode="numeric"
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">E-mail (Cadastrado)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </div>

      {/* Alterar Senha */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-2xs space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 font-heading">Alterar Senha</h2>

        {senhaMsg && (
          <div className="p-3 rounded-lg bg-orange-50 text-[var(--color-primary)] text-xs border border-orange-100 font-medium">
            {senhaMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Nova Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <Button type="submit" disabled={senhaLoading} size="sm" variant="outline">
            {senhaLoading ? 'Atualizando...' : 'Atualizar Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}
