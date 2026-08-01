'use client';

import { useState } from 'react';
import { formatPhoneBR } from '@/lib/phoneUtils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { X, Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authModalMode || 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');

  if (!isAuthModalOpen) return null;


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
    } else {
      closeAuthModal();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          telefone,
        },
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      closeAuthModal();
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/minha-conta/perfil`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-100 p-6">
        
        {/* Fechar */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black font-heading text-zinc-900">
            {mode === 'login' && 'Entrar na sua conta'}
            {mode === 'register' && 'Criar sua conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {mode === 'login' && 'Acesse seus pedidos, endereços e acompanhamento em tempo real.'}
            {mode === 'register' && 'Crie sua conta para acompanhar pedidos e salvar seus endereços.'}
            {mode === 'forgot' && 'Informe seu e-mail para receber as instruções.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100">
            {error}
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm font-semibold text-zinc-800">{successMsg}</p>
            <Button onClick={closeAuthModal} className="w-full mt-4">
              Ok, Entendi
            </Button>
          </div>
        ) : (
          <>


            {/* Form Login */}
            {mode === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-zinc-700">Senha</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-[var(--color-primary)] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-2">
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>

                <p className="text-center text-xs text-zinc-500 pt-2">
                  Não possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-bold text-[var(--color-primary)] hover:underline"
                  >
                    Criar conta
                  </button>
                </p>
              </form>
            )}

            {/* Form Registro */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nome Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-2">
                  {loading ? 'Criando conta...' : 'Cadastrar'}
                </Button>

                <p className="text-center text-xs text-zinc-500 pt-2">
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-[var(--color-primary)] hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              </form>
            )}

            {/* Form Forgot Password */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">E-mail cadastrado</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-2">
                  {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </Button>

                <p className="text-center text-xs text-zinc-500 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-zinc-600 hover:underline"
                  >
                    Voltar para o Login
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
