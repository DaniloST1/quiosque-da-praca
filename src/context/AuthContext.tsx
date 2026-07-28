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
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  signOut: () => Promise<void>;
  refreshCliente: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [cliente, setCliente] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const fetchClientePerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (!error && data) {
        setCliente(data);
      }
    } catch (e) {
      console.error('Erro ao buscar perfil do cliente:', e);
    }
  };

  const refreshCliente = async () => {
    if (user) {
      await fetchClientePerfil(user.id);
    }
  };

  useEffect(() => {
    // Session inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClientePerfil(session.user.id);
      }
      setLoading(false);
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchClientePerfil(session.user.id);
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
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
        signOut,
        refreshCliente,
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
