import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { getConfig } from '@/lib/theme';
import { MesaCardapio } from '@/components/mesa/MesaCardapio';

interface MesaPageProps {
  params: Promise<{ token: string }>;
}

export default async function MesaPage({ params }: MesaPageProps) {
  const { token } = await params;
  const supabase = createAdminClient();
  const config = await getConfig();

  // Validate mesa token
  const { data: mesa } = await supabase
    .from('mesas')
    .select('id, numero, status')
    .eq('qr_token', token)
    .single();

  if (!mesa) return notFound();

  // Fetch menu data
  const [
    { data: categorias },
    { data: produtos },
    { data: combos },
  ] = await Promise.all([
    supabase.from('categorias').select('*').eq('ativa', true).order('ordem'),
    supabase.from('produtos').select('*, categoria:categoria_id(slug)').eq('ativo', true).order('ordem'),
    supabase.from('combos').select('*').eq('ativo', true).order('ordem'),
  ]);

  return (
    <MesaCardapio
      mesa={mesa}
      categorias={categorias || []}
      produtos={produtos || []}
      combos={combos || []}
      config={config}
    />
  );
}
