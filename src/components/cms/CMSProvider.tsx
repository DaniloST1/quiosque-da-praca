'use client';
import { useCMS } from '@/hooks/useCMS';
import { CMSToolbar } from './CMSToolbar';
import { CartDrawer } from '@/components/layout/CartDrawer';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5519991737183';

export function CMSProvider({ children }: { children: React.ReactNode }) {
  useCMS(); // Initializes the store, syncs with Supabase auth session

  return (
    <>
      {children}
      <CartDrawer whatsappNumber={WHATSAPP_NUMBER} />
      <CMSToolbar />
    </>
  );
}
