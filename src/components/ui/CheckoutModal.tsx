'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { createPedido } from '@/app/actions/pedido';
import { Phone, User, MapPin, CheckCircle2, ChevronRight, Loader2, Edit3 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string;
}

type Step = 'telefone' | 'dados' | 'revisao';
type Tipo = 'delivery' | 'retirada' | 'local';

interface ClienteData {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

const defaultCliente: ClienteData = {
  nome: '',
  email: '',
  telefone: '',
  endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
};

function normalizarTelefone(tel: string) {
  return tel.replace(/\D/g, '');
}

function formatarTelefone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export function CheckoutModal({ isOpen, onClose, whatsappNumber }: CheckoutModalProps) {
  const cart = useCart();
  const { user, cliente: authCliente } = useAuth();

  const [step, setStep] = useState<Step>('dados');
  const [tipo, setTipo] = useState<Tipo>('delivery');
  const [pagamento, setPagamento] = useState('pix');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [clienteExistente, setClienteExistente] = useState(false);

  const [rawTelefone, setRawTelefone] = useState('');
  const [cliente, setCliente] = useState<ClienteData>(defaultCliente);

  useEffect(() => {
    if (authCliente && isOpen) {
      setCliente({
        id: authCliente.id,
        nome: authCliente.nome || '',
        email: authCliente.email || user?.email || '',
        telefone: authCliente.telefone || '',
        endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
      });
      setStep('dados');
    }
  }, [authCliente, user, isOpen]);

  const subtotal = cart.total();
  const taxaEntrega = tipo === 'delivery' ? 5.00 : 0;
  const total = subtotal + taxaEntrega;

  const handleClose = () => {
    setStep('telefone');
    setRawTelefone('');
    setCliente(defaultCliente);
    setClienteExistente(false);
    onClose();
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawTelefone(formatarTelefone(e.target.value));
  };

  const handleBuscarCliente = async () => {
    const telNorm = normalizarTelefone(rawTelefone);
    if (telNorm.length < 10) return alert('Informe um telefone válido com DDD.');
    setBuscando(true);
    try {
      const res = await fetch(`/api/clientes/buscar?telefone=${telNorm}`);
      const data = await res.json();
      if (data.cliente) {
        setCliente({
          id: data.cliente.id,
          nome: data.cliente.nome || '',
          email: data.cliente.email || '',
          telefone: rawTelefone,
          endereco: {
            cep: data.cliente.endereco?.cep || '',
            logradouro: data.cliente.endereco?.logradouro || '',
            numero: data.cliente.endereco?.numero || '',
            complemento: data.cliente.endereco?.complemento || '',
            bairro: data.cliente.endereco?.bairro || '',
            cidade: data.cliente.endereco?.cidade || '',
            estado: data.cliente.endereco?.estado || '',
          },
        });
        setClienteExistente(true);
      } else {
        setCliente({ ...defaultCliente, telefone: rawTelefone });
        setClienteExistente(false);
      }
      setStep('dados');
    } catch (err) {
      alert('Erro ao consultar o cadastro. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  const handleCEP = async (cep: string) => {
    const val = cep.replace(/\D/g, '');
    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCliente(prev => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf,
            }
          }));
        }
      } catch {}
    }
  };

  const handleProsseguirDados = async () => {
    if (!cliente.nome) return alert('Informe seu nome completo.');
    if (tipo === 'delivery' && !cliente.endereco.logradouro) return alert('Informe o endereço de entrega.');

    // Salva/Atualiza o cliente no banco
    setLoading(true);
    try {
      const res = await fetch('/api/clientes/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: cliente.nome,
          email: cliente.email,
          telefone: rawTelefone,
          endereco: cliente.endereco,
        }),
      });
      const data = await res.json();
      if (data.cliente?.id) {
        setCliente(prev => ({ ...prev, id: data.cliente.id }));
      }
      setStep('revisao');
    } catch {
      alert('Erro ao salvar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarPedido = async () => {
    setLoading(true);
    const data = {
      cliente_nome: cliente.nome,
      cliente_telefone: rawTelefone,
      cliente_id: cliente.id,
      tipo,
      endereco: tipo === 'delivery' ? cliente.endereco : undefined,
      observacoes,
      metodo_pagamento: pagamento,
      subtotal,
      taxa_entrega: taxaEntrega,
      total,
      itens: cart.items.map(i => ({
        produto_id: i.produto.id,
        nome: i.produto.nome,
        preco: i.produto.preco,
        quantidade: i.quantidade,
        removidos: i.removidos,
        adicionais: i.adicionais,
      })),
    };

    const res = await createPedido(data);
    setLoading(false);

    if (res.success && res.pedido) {
      const message =
        `*NOVO PEDIDO #${res.pedido.numero}*\n\n` +
        `*Cliente:* ${cliente.nome}\n` +
        `*Tipo:* ${tipo.toUpperCase()}\n` +
        (tipo === 'delivery' ? `*Endereço:* ${cliente.endereco.logradouro}, ${cliente.endereco.numero} - ${cliente.endereco.bairro}\n` : '') +
        `*Pagamento:* ${pagamento.toUpperCase()}\n\n*Itens:*\n` +
        cart.items.map(i => `${i.quantidade}x ${i.produto.nome} (${formatCurrency(i.produto.preco)})`).join('\n') +
        `\n\n*Total:* ${formatCurrency(total)}`;

      const rawNumber = whatsappNumber.replace(/\D/g, '');
      const cleanNumber = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;
      window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`, '_blank');
      cart.clearCart();
      handleClose();
      alert(`Pedido #${res.pedido.numero} realizado com sucesso!`);
    } else {
      alert('Erro ao realizar pedido: ' + res.error);
    }
  };

  const stepTitles: Record<Step, string> = {
    telefone: 'Finalizar Pedido',
    dados: clienteExistente ? 'Confirme seus dados' : 'Seus dados',
    revisao: 'Revisão do Pedido',
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={stepTitles[step]} className="max-w-md max-h-[90vh] overflow-y-auto">

      {/* Indicador de etapas */}
      <div className="flex items-center gap-1 mb-6">
        {(['telefone', 'dados', 'revisao'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step === s ? 'bg-[var(--color-primary)] text-white' : 
                ['dados', 'revisao'].indexOf(step) > idx ? 'bg-green-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
              {['dados', 'revisao'].indexOf(step) > idx ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            {idx < 2 && <div className={`flex-1 h-0.5 ${['dados', 'revisao'].indexOf(step) > idx ? 'bg-green-400' : 'bg-zinc-200'}`} />}
          </div>
        ))}
      </div>

      {/* ─── ETAPA 1: TELEFONE ─── */}
      {step === 'telefone' && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <p className="text-zinc-500 text-sm">Informe seu WhatsApp para identificarmos seu cadastro ou criar um novo.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Seu WhatsApp</label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={rawTelefone}
              onChange={handleTelefoneChange}
              onKeyDown={e => e.key === 'Enter' && handleBuscarCliente()}
              className="w-full border-2 border-zinc-200 focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-lg font-semibold outline-none transition-colors"
            />
          </div>

          <Button onClick={handleBuscarCliente} disabled={buscando} className="w-full h-12 text-base gap-2">
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {buscando ? 'Buscando...' : 'Continuar'}
          </Button>
        </div>
      )}

      {/* ─── ETAPA 2: DADOS ─── */}
      {step === 'dados' && (
        <div className="flex flex-col gap-4">
          {clienteExistente && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Olá, {cliente.nome.split(' ')[0]}! Encontramos seu cadastro.
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Tipo de Pedido</label>
            <div className="flex bg-zinc-100 p-1 rounded-lg">
              {(['delivery', 'retirada', 'local'] as Tipo[]).map(t => (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors capitalize ${tipo === t ? 'bg-white shadow text-[var(--color-primary)]' : 'text-zinc-500'}`}>
                  {t === 'local' ? 'Na Mesa' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Nome e Email */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Nome Completo *</label>
              <input value={cliente.nome} onChange={e => setCliente(p => ({ ...p, nome: e.target.value }))}
                placeholder="Seu nome completo" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">E-mail (opcional)</label>
              <input type="email" value={cliente.email} onChange={e => setCliente(p => ({ ...p, email: e.target.value }))}
                placeholder="seu@email.com" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </div>
          </div>

          {/* Endereço (delivery) */}
          {tipo === 'delivery' && (
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Endereço de Entrega
              </label>
              <input placeholder="CEP" value={cliente.endereco.cep}
                onChange={e => setCliente(p => ({ ...p, endereco: { ...p.endereco, cep: e.target.value } }))}
                onBlur={e => handleCEP(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Logradouro" value={cliente.endereco.logradouro}
                  onChange={e => setCliente(p => ({ ...p, endereco: { ...p.endereco, logradouro: e.target.value } }))}
                  className="col-span-2 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
                <input placeholder="Nº" value={cliente.endereco.numero}
                  onChange={e => setCliente(p => ({ ...p, endereco: { ...p.endereco, numero: e.target.value } }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
              </div>
              <input placeholder="Bairro" value={cliente.endereco.bairro}
                onChange={e => setCliente(p => ({ ...p, endereco: { ...p.endereco, bairro: e.target.value } }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
              <input placeholder="Complemento (opcional)" value={cliente.endereco.complemento}
                onChange={e => setCliente(p => ({ ...p, endereco: { ...p.endereco, complemento: e.target.value } }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </div>
          )}

          {/* Pagamento e Obs */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Pagamento</label>
              <select value={pagamento} onChange={e => setPagamento(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Observações (opcional)</label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                placeholder="Ex: sem cebola, ponto da carne..." rows={2}
                className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </div>
          </div>

          <div className="flex gap-3 mt-1">
            <Button variant="outline" onClick={() => setStep('telefone')} className="flex-1">Voltar</Button>
            <Button onClick={handleProsseguirDados} disabled={loading} className="flex-1 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Revisar Pedido
            </Button>
          </div>
        </div>
      )}

      {/* ─── ETAPA 3: REVISÃO ─── */}
      {step === 'revisao' && (
        <div className="flex flex-col gap-4">
          {/* Dados do cliente */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-1.5"><User className="w-4 h-4" /> Dados do Cliente</h3>
              <button onClick={() => setStep('dados')} className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 hover:underline">
                <Edit3 className="w-3 h-3" /> Editar
              </button>
            </div>
            <div className="space-y-1 text-sm text-zinc-600">
              <p><span className="font-semibold text-zinc-800">{cliente.nome}</span></p>
              <p>{rawTelefone}</p>
              {cliente.email && <p>{cliente.email}</p>}
              {tipo === 'delivery' && cliente.endereco.logradouro && (
                <p className="flex items-start gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                  {cliente.endereco.logradouro}, {cliente.endereco.numero} — {cliente.endereco.bairro}
                  {cliente.endereco.complemento && ` (${cliente.endereco.complemento})`}
                </p>
              )}
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-bold text-zinc-700 mb-2">Itens do Pedido</h3>
            <div className="space-y-2">
              {cart.items.map(item => (
                <div key={item.produto.id} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="font-medium">{item.quantidade}x {item.produto.nome}</span>
                    {item.removidos && item.removidos.length > 0 && (
                      <p className="text-xs text-red-500">- {item.removidos.map((r: any) => r.nome).join(', ')}</p>
                    )}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <p className="text-xs text-green-600">+ {item.adicionais.map((a: any) => a.nome).join(', ')}</p>
                    )}
                  </div>
                  <span className="text-zinc-700 font-semibold">{formatCurrency(item.produto.preco * item.quantidade)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo e Pagamento */}
          <div className="text-sm text-zinc-500 flex justify-between">
            <span>Modalidade</span>
            <span className="font-semibold text-zinc-700 capitalize">{tipo === 'local' ? 'Na Mesa' : tipo}</span>
          </div>
          <div className="text-sm text-zinc-500 flex justify-between">
            <span>Pagamento</span>
            <span className="font-semibold text-zinc-700 uppercase">{pagamento.replace('_', ' ')}</span>
          </div>

          {/* Totalizador */}
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {tipo === 'delivery' && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Taxa de Entrega</span><span>{formatCurrency(taxaEntrega)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-zinc-900 pt-1.5 border-t border-zinc-200">
              <span>Total</span>
              <span className="text-[var(--color-primary)]">{formatCurrency(total)}</span>
            </div>
          </div>

          {observacoes && (
            <p className="text-xs text-zinc-500 bg-amber-50 border border-amber-100 rounded-lg p-2">
              💬 <span className="font-semibold">Obs:</span> {observacoes}
            </p>
          )}

          <div className="flex gap-3 mt-1">
            <Button variant="outline" onClick={() => setStep('dados')} className="flex-1">Voltar</Button>
            <Button onClick={handleConfirmarPedido} disabled={loading} className="flex-1 h-12 text-base gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? 'Enviando...' : 'Confirmar Pedido'}
            </Button>
          </div>
        </div>
      )}

    </Modal>
  );
}
