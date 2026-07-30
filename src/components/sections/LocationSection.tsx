'use client';
import { useState } from 'react';
import { MapPin, Navigation, Map } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface LocationSectionProps {
  endereco: string | null;
  cidade: string | null;
  embedUrl: string | null;
}

export function LocationSection({ endereco, cidade, embedUrl }: LocationSectionProps) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  const getFullAddress = () => {
    if (endereco && cidade) return `${endereco}, ${cidade}`;
    if (endereco) return endereco;
    if (cidade) return cidade;
    return 'Campinas, SP';
  };

  // Use o embed configurado pelo admin. Se não houver, gera dinamicamente pelo endereço.
  const getMapSrc = () => {
    if (embedUrl) return embedUrl;
    const address = getFullAddress();
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=16`;
  };

  const getGoogleMapsLink = () => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(getFullAddress())}`;
  const getWazeLink = () => `https://waze.com/ul?q=${encodeURIComponent(getFullAddress())}&navigate=yes`;

  return (
    <section id="localizacao" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 font-heading mb-4">
            Nossa <span className="text-[var(--color-primary)]">Localização</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Venha nos visitar e experimentar o melhor sabor da região.
          </p>
        </div>

        <div className="bg-zinc-50 rounded-3xl overflow-hidden shadow-xl border border-zinc-100 flex flex-col md:flex-row">
          
          <div className="w-full md:w-1/2 h-[360px] sm:h-[450px] md:h-auto min-h-[360px] md:min-h-[480px]">
            <iframe 
              src={getMapSrc()}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de localização"
            />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-black text-zinc-900 font-heading mb-4">
              Onde estamos
            </h3>
            
            <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
              {endereco || 'Endereço não cadastrado'}
              <br />
              <span className="font-semibold">{cidade || 'Campinas - SP'}</span>
            </p>

            <Button size="lg" className="w-full sm:w-auto" onClick={() => setIsMapModalOpen(true)}>
              <Navigation className="w-5 h-5 mr-2" />
              Como Chegar
            </Button>
          </div>

        </div>
      </div>

      <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title="Escolha o aplicativo">
        <div className="flex flex-col gap-3 p-2">
          <a href={getGoogleMapsLink()} target="_blank" rel="noreferrer" onClick={() => setIsMapModalOpen(false)} className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Map className="w-6 h-6 text-blue-500" />
            <div className="flex-1">
              <p className="font-bold text-zinc-900">Google Maps</p>
              <p className="text-sm text-zinc-500">Abrir rota no Google Maps</p>
            </div>
          </a>
          <a href={getWazeLink()} target="_blank" rel="noreferrer" onClick={() => setIsMapModalOpen(false)} className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 hover:border-sky-500 hover:bg-sky-50 transition-colors">
            <Navigation className="w-6 h-6 text-sky-500" />
            <div className="flex-1">
              <p className="font-bold text-zinc-900">Waze</p>
              <p className="text-sm text-zinc-500">Abrir rota no Waze</p>
            </div>
          </a>
        </div>
      </Modal>
    </section>
  );
}
