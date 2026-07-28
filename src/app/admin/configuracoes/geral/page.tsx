import { MapPin } from 'lucide-react';
import { ConfigGeralClient } from '@/components/admin/configuracoes/ConfigGeralClient';

export default function ConfigGeralPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm">
          <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Endereço e Mapa</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure o endereço físico e a localização no mapa</p>
        </div>
      </div>
      <ConfigGeralClient />
    </div>
  );
}
