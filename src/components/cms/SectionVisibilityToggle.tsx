'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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

export function SectionVisibilityToggle({ sectionKey, sectionName, isVisible, isEditMode, children }: Props) {
  const currentUserId = useCMSStore((s) => s.currentUserId);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  if (!isEditMode && !isVisible) {
    return null;
  }

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
      router.refresh();
    }
  };

  return (
    <div 
      className="relative group transition-all duration-300"
      style={!isVisible ? {
        opacity: 0.7,
        filter: 'grayscale(100%)',
        backgroundColor: '#f1f5f9',
        border: '2px dashed #94a3b8'
      } : {}}
    >
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleVisibility}
          disabled={saving}
          className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center border border-zinc-200 text-xl hover:bg-zinc-50 transition-colors"
          title={isVisible ? 'Ocultar esta seção' : 'Tornar seção visível'}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          ) : isVisible ? (
            '👁'
          ) : (
            '👁̶'
          )}
        </button>
      </div>

      {!isVisible && (
        <div className="absolute top-4 left-4 z-40 bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
          <span>👁️</span> Oculto para clientes
        </div>
      )}

      <div className="w-full relative z-0">
        {children}
      </div>
    </div>
  );
}
