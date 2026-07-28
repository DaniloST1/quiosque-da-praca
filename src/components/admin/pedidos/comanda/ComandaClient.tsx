'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ComandaClient({ pedidoId }: { pedidoId: string }) {
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPedido = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select(`
          *,
          mesa:mesas(numero),
          pedido_itens(
            *,
            quantidade,
            preco_unitario,
            subtotal,
            observacoes,
            produto:produtos(nome),
            personalizacoes:pedido_item_personalizacao(
              tipo,
              ingrediente:estoque_itens(nome)
            )
          )
        `)
        .eq('id', pedidoId)
        .single();
        
      setPedido(data);
      setLoading(false);
      
      // Auto-print option could be enabled here
      // if (data) setTimeout(() => window.print(), 500);
    };
    fetchPedido();
  }, [pedidoId]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando comanda...</div>;
  if (!pedido) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>;

  return (
    <>
      {/* Área de Controle (NÃO IMPRESSA) */}
      <div className="bg-zinc-100 p-4 flex justify-between items-center print:hidden border-b">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-medium">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-80">
          <Printer className="w-5 h-5" /> Imprimir Comanda
        </button>
      </div>

      {/* Comanda Térmica (80mm) */}
      <div className="bg-white min-h-screen flex justify-center py-8 print:py-0 print:block">
        <div className="w-[80mm] bg-white text-black font-mono text-[12px] leading-tight p-2 shadow-lg print:shadow-none mx-auto print:mx-0 print:w-full print:p-0">
          
          {/* Cabeçalho */}
          <div className="text-center mb-4 border-b border-dashed border-black pb-3">
            <h1 className="font-bold text-lg leading-none uppercase">Quiosque da Praça</h1>
            <p>Rua da Matriz, 123 - Centro</p>
            <p>CNPJ: 00.000.000/0001-00</p>
            <p>Tel: (11) 99999-9999</p>
            <div className="mt-2 font-bold text-base">
              PEDIDO #{pedido.numero}
            </div>
            <p className="mt-1">{format(new Date(pedido.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
          </div>

          {/* Dados do Cliente / Tipo */}
          <div className="mb-3 border-b border-dashed border-black pb-3 uppercase">
            <p className="font-bold text-sm mb-1">
              TIPO: {pedido.tipo === 'local' ? 'NA MESA' : pedido.tipo === 'delivery' ? 'DELIVERY' : 'RETIRADA'}
            </p>
            {pedido.mesa?.numero && (
              <p className="font-bold text-lg">MESA: {pedido.mesa.numero}</p>
            )}
            {pedido.cliente_nome && (
              <p>CLIENTE: {pedido.cliente_nome}</p>
            )}
            {pedido.cliente_tel && (
              <p>TEL: {pedido.cliente_tel}</p>
            )}
            {pedido.tipo === 'delivery' && pedido.cliente_endereco && (
              <p className="mt-1">
                END: {pedido.cliente_endereco}, {pedido.cliente_numero}
                {pedido.cliente_bairro && ` - ${pedido.cliente_bairro}`}
              </p>
            )}
          </div>

          {/* Itens do Pedido */}
          <div className="mb-3 border-b border-dashed border-black pb-3">
            <div className="flex justify-between font-bold mb-1">
              <span>QTD ITEM</span>
              <span>TOTAL</span>
            </div>
            {pedido.pedido_itens?.map((item: any, i: number) => {
              const removidos = (item.personalizacoes || []).filter((p: any) => p.tipo === 'removido');
              const adicionados = (item.personalizacoes || []).filter((p: any) => p.tipo === 'adicionado');
              return (
                <div key={i} className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-bold">
                      {item.quantidade}x {item.produto?.nome?.toUpperCase()}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                  {item.observacoes && (
                    <p className="pl-4 text-[10px] mt-0.5">* OBS: {item.observacoes.toUpperCase()}</p>
                  )}
                  {removidos.length > 0 && (
                    <p className="pl-4 text-[10px] mt-0.5 font-bold uppercase">** REMOVER: {removidos.map((p: any) => p.ingrediente?.nome).filter(Boolean).join(', ')}</p>
                  )}
                  {adicionados.length > 0 && (
                    <p className="pl-4 text-[10px] mt-0.5 font-bold uppercase">** ADICIONAR: {adicionados.map((p: any) => p.ingrediente?.nome).filter(Boolean).join(', ')}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totais */}
          <div className="mb-4 text-right">
            <p>SUBTOTAL: {formatCurrency(pedido.subtotal)}</p>
            {pedido.taxa_entrega > 0 && (
              <p>TAXA ENT.: {formatCurrency(pedido.taxa_entrega)}</p>
            )}
            <p className="font-bold text-base mt-1">TOTAL: {formatCurrency(pedido.total)}</p>
          </div>

          {/* Observação Geral */}
          {pedido.observacoes && (
            <div className="mb-4 border border-black p-1">
              <p className="font-bold">OBS. GERAIS:</p>
              <p className="uppercase break-words">{pedido.observacoes}</p>
            </div>
          )}

          {/* Pagamento */}
          <div className="text-center mb-6">
            <p>Pagamento: {pedido.metodo_pagamento ? pedido.metodo_pagamento.toUpperCase() : 'NÃO DEFINIDO'}</p>
          </div>

          {/* Rodapé */}
          <div className="text-center text-[10px] mt-8 mb-4">
            <p>Obrigado pela preferência!</p>
            <p>*** NÃO É DOCUMENTO FISCAL ***</p>
          </div>
          
          <div className="text-center">
            - - - - - - - - - - - - - - - - - - - -
          </div>
        </div>
      </div>
      
      {/* Estilos Globais de Impressão (Só injetado nesta página) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          @page {
            size: 80mm auto; /* Configura pro padrão de 80mm Thermal */
            margin: 0mm; 
          }
          /* Esconde qualquer UI que tenha vazado */
          header, footer, nav, aside { display: none !important; }
        }
      `}} />
    </>
  );
}
