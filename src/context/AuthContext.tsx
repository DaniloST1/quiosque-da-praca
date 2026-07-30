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

  const fetchClientePerfil = async (userId: string, userObj?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (data) {
        setCliente(data);
      } else if (userObj) {
        const meta = userObj.user_metadata || {};
        const nome = meta.full_name || meta.name || userObj.email?.split('@')[0] || 'Cliente';
        const { data: newCliente } = await supabase
          .from('clientes')
          .insert({
            auth_user_id: userObj.id,
            nome,
            email: userObj.email,
            foto_url: meta.avatar_url || meta.picture || null,
          })
          .select()
          .single();

        if (newCliente) {
          setCliente(newCliente);
        }
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
    // Session inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClientePerfil(session.user.id, session.user);
      }
      setLoading(false);
    });

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
