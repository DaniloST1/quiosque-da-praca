import { createAdminClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import AvaliarClient from './AvaliarClient';

export default async function AvaliarPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  
  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('id, numero, avaliado, itens:pedido_itens(produto_id, nome, quantidade)')
    .eq('id', params.id)
    .single();

  if (error || !pedido) {
    return notFound();
  }

  // Remove duplicate products so we evaluate each product only once
  const uniqueProducts = [];
  const seen = new Set();
  
  if (pedido.itens) {
    for (const item of pedido.itens) {
      if (!seen.has(item.produto_id)) {
        seen.add(item.produto_id);
        uniqueProducts.push({ produto_id: item.produto_id, nome: item.nome });
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 md:p-8 bg-zinc-900 text-white">
            <h1 className="text-2xl font-black">Avalie seu pedido #{pedido.numero}</h1>
            <p className="text-zinc-400 mt-2">Sua opinião é muito importante para nós!</p>
          </div>
          
          <div className="p-6 md:p-8">
            {pedido.avaliado ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Este pedido já foi avaliado</h2>
                <p className="text-zinc-500 mt-2">Muito obrigado pelo seu feedback contínuo.</p>
              </div>
            ) : (
              <AvaliarClient pedidoId={pedido.id} produtos={uniqueProducts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
