'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { formatPhoneBR } from '@/lib/phoneUtils';
import { User, Phone, Mail, Camera, Lock, Upload, Trash2, Loader2 } from 'lucide-react';

export default function PerfilPage() {
  const { user, cliente, refreshCliente } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [nome, setNome] = useState(cliente?.nome || '');
  const [telefone, setTelefone] = useState(formatPhoneBR(cliente?.telefone || ''));
  const [fotoUrl, setFotoUrl] = useState(cliente?.foto_url || '');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [senhaLoading, setSenhaLoading] = useState(false);
  const [senhaMsg, setSenhaMsg] = useState('');

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg('Selecione um arquivo de imagem válido.');
      return;
    }

    setUploadingFoto(true);
    setMsg('');

    try {
      const url = await uploadImage('uploads', file);
      setFotoUrl(url);
      setMsg('Foto anexada com sucesso! Clique em "Salvar Alterações" para atualizar o seu perfil.');
    } catch (err: any) {
      console.error(err);
      setMsg('Erro ao enviar imagem: ' + (err.message || 'Falha no envio'));
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
          {/* Anexar Foto de Perfil */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">Foto de Perfil</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-100 border-2 border-[var(--color-primary)] shrink-0 flex items-center justify-center shadow-xs">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-zinc-400" />
                )}
                {uploadingFoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFoto}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
                  >
                    {uploadingFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Anexar Foto
                  </button>

                  {fotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFotoUrl('')}
                      disabled={uploadingFoto}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover Foto
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">Formatos aceitos: JPG, PNG, WEBP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoUpload}
                  className="hidden"
                  disabled={uploadingFoto}
                />
              </div>
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
