'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useCMSStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Props {
  sectionKey: string;
  sectionName: string;
  isVisible: boolean;
  isEditMode: boolean;
  children: React.ReactNode;
}

export function SectionVisibilityWrapper({ sectionKey, sectionName, isVisible, isEditMode, children }: Props) {
  const currentUserId = useCMSStore((s) => s.currentUserId);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Se não estiver em modo de edição e a seção estiver oculta, não renderiza
  if (!isEditMode && !isVisible) {
    return null;
  }

  // Se não estiver em modo de edição, apenas renderiza os children (o próprio componente)
  if (!isEditMode) {
    return <>{children}</>;
  }

  const toggleVisibility = async () => {
    if (!currentUserId) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('secoes_site')
      .update({ visivel: !isVisible })
      .eq('chave', sectionKey);

    setSaving(false);
    
    if (error) {
      alert('Erro ao atualizar visibilidade: ' + error.message);
    } else {
      router.refresh(); // Refresh do app router para propagar
    }
  };

  return (
    <div className="relative group transition-all duration-300">
      {/* Botão de Toggle - Top Right */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleVisibility}
          disabled={saving}
          className={`p-3 rounded-full transition-all flex items-center justify-center hover:scale-110 shadow-lg ${
            isVisible 
              ? 'bg-white text-zinc-900 border border-zinc-200' 
              : 'bg-zinc-900 text-white border border-zinc-700'
          }`}
          title={isVisible ? 'Ocultar esta seção' : 'Tornar seção visível'}
        >
          {saving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isVisible ? (
            <Eye className="w-6 h-6" />
          ) : (
            <EyeOff className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Overlay Escuro para estado oculto */}
      {!isVisible && (
        <div className="absolute inset-0 bg-black/60 z-40 pointer-events-none flex flex-col items-center justify-center border-4 border-dashed border-zinc-600">
          <div className="text-white font-bold text-xl md:text-2xl tracking-widest flex items-center gap-3 bg-black/40 px-6 py-3 rounded-xl backdrop-blur-md">
            <EyeOff className="w-6 h-6 md:w-8 md:h-8" />
            OCULTO PARA CLIENTES
          </div>
        </div>
      )}

      {/* Conteúdo com efeito de desfoque/esmaecimento quando oculto */}
      <div className={`transition-all duration-500 ${!isVisible ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        {children}
      </div>
    </div>
  );
}
