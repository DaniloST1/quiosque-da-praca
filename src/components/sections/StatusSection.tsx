'use client';
import { Clock } from 'lucide-react';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { HorarioItem } from '@/types/database';

interface StatusSectionProps {
  horarios: HorarioItem[];
}

export function StatusSection({ horarios }: StatusSectionProps) {
  const isOpen = useBusinessHours(horarios);

  return (
    <section className="bg-zinc-100 py-2 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            {isOpen ? (
              <>
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            )}
          </div>
          <span className="font-semibold text-zinc-700 text-sm">
            {isOpen ? 'Aberto Agora' : 'Fechado no momento'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="w-4 h-4 text-[var(--color-primary)]" />
          <span>
            {isOpen 
              ? 'Faça seu pedido e receba em casa ou retire no local.'
              : 'Verifique nossos horários de funcionamento no rodapé.'}
          </span>
        </div>

      </div>
    </section>
  );
}
