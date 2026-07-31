'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface ClientePerfil {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  pontos: number;
  aceita_marketing: boolean;
  notificacoes_whatsapp: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  cliente: ClientePerfil | null;
  loading: boolean;
  authError: string | null;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  signOut: () => Promise<void>;
  refreshCliente: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [cliente, setCliente] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const fetchClientePerfil = async (userId: string, userObj?: User | null) => {
    try {
      const res = await fetch('/api/clientes/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userObj?.email,
          metadata: userObj?.user_metadata,
        }),
      });
      const data = await res.json();
      if (data.cliente) {
        setCliente(data.cliente);
      }
    } catch (e) {
      console.error('Erro ao buscar/criar perfil do cliente:', e);
    }
  };

  const refreshCliente = async () => {
    if (user) {
      await fetchClientePerfil(user.id, user);
    }
  };

  useEffect(() => {
    // Detecta erros de OAuth na URL hash (#error=...)
    if (typeof window !== 'undefined' && window.location.hash.includes('error=')) {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const errDesc = params.get('error_description') || params.get('error');
        if (errDesc) {
          console.error('[Auth OAuth Error]:', errDesc);
          setAuthError('Erro na autenticação com o Google. Por favor, verifique se o Client Secret no Supabase está correto.');
        }
        // Limpa a hash da URL sem recarregar a página
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {}
    }

    // Session inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClientePerfil(session.user.id, session.user);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchClientePerfil(session.user.id, session.user);
      } else {
        setCliente(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCliente(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        cliente,
        loading,
        authError,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
        signOut,
        refreshCliente,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}



export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
