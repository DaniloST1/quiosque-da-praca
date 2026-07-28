import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { FichaTecnicaClient } from '@/components/admin/fichatecnica/FichaTecnicaClient';

interface FichaTecnicaPageProps {
  params: Promise<{ id: string }>;
}

export default async function FichaTecnicaPage({ params }: FichaTecnicaPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: produto } = await supabase
    .from('produtos')
    .select('id, nome')
    .eq('id', id)
    .single();

  if (!produto) return notFound();

  return <FichaTecnicaClient produtoId={produto.id} produtoNome={produto.nome} />;
}
