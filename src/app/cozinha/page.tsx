import { CozinhaKDS } from '@/components/cozinha/CozinhaKDS';

export const metadata = {
  title: 'KDS Cozinha | Quiosque da Praça',
  description: 'Tela da Cozinha - Kitchen Display System',
};

export default function CozinhaPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <CozinhaKDS />
    </main>
  );
}
