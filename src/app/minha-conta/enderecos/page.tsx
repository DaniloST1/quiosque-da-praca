'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Briefcase, Map, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Endereco {
  id: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

export default function EnderecosPage() {
  const { cliente } = useAuth();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apelido, setApelido] = useState('Casa');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('São Paulo');
  const [estado, setEstado] = useState('SP');
  const [principal, setPrincipal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEnderecos = async () => {
    const clienteId = cliente?.id;
    if (!clienteId) return;
    setLoading(true);
    const { data } = await supabase
      .from('cliente_enderecos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('principal', { ascending: false });

    if (data) setEnderecos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEnderecos();
  }, [cliente?.id]);

  const handleCEP = async (val: string) => {
    const clean = val.replace(/\D/g, '');
    setCep(val);
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setLogradouro(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || 'São Paulo');
          setEstado(data.uf || 'SP');
        }
      } catch {}
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!cliente?.id) {
      setErrorMsg('Sessão inválida. Por favor faça login novamente.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/clientes/enderecos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: cliente.id,
          apelido,
          cep,
          logradouro,
          numero,
          complemento: complemento || null,
          bairro,
          cidade,
          estado,
          principal,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMsg(json.error || 'Erro ao salvar endereço.');
      } else {
        setIsFormOpen(false);
        setCep('');
        setLogradouro('');
        setNumero('');
        setComplemento('');
        setBairro('');
        setPrincipal(false);
        fetchEnderecos();
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao salvar endereço.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este endereço?')) return;
    try {
      await fetch(`/api/clientes/enderecos?id=${id}`, { method: 'DELETE' });
      fetchEnderecos();
    } catch {}
  };

  const handleSetPrincipal = async (id: string) => {
    if (!cliente?.id) return;
    await supabase
      .from('cliente_enderecos')
      .update({ principal: false })
      .eq('cliente_id', cliente.id);

    await supabase
      .from('cliente_enderecos')
      .update({ principal: true })
      .eq('id', id);

    fetchEnderecos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 font-heading">Meus Endereços</h1>
          <p className="text-xs text-zinc-500 mt-1">Gerencie os locais de entrega salvos no seu perfil.</p>
        </div>
        <Button onClick={() => { setErrorMsg(''); setIsFormOpen(true); }} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Endereço
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : enderecos.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-zinc-200 shadow-xs">
          <MapPin className="w-14 h-14 text-zinc-300 mx-auto mb-3" />
          <p className="text-base font-bold text-zinc-800">Nenhum endereço cadastrado</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-5">
            Cadastre seus endereços de entrega para agilizar seus pedidos na hora de finalizar a compra.
          </p>
          <Button onClick={() => { setErrorMsg(''); setIsFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Endereço
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enderecos.map((end) => (
            <div
              key={end.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                end.principal ? 'border-[var(--color-primary)] shadow-xs ring-1 ring-[var(--color-primary)]/20' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {end.apelido === 'Casa' && <Home className="w-4 h-4 text-orange-500" />}
                  {end.apelido === 'Trabalho' && <Briefcase className="w-4 h-4 text-blue-500" />}
                  {end.apelido !== 'Casa' && end.apelido !== 'Trabalho' && <Map className="w-4 h-4 text-purple-500" />}
                  <span className="font-bold text-sm text-zinc-900">{end.apelido}</span>
                </div>
                {end.principal ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[var(--color-primary)]">
                    <CheckCircle2 className="w-3 h-3" /> Principal
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPrincipal(end.id)}
                    className="text-xs font-semibold text-zinc-400 hover:text-[var(--color-primary)] transition-colors"
                  >
                    Tornar principal
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                {end.logradouro}, {end.numero} {end.complemento ? `- ${end.complemento}` : ''}<br />
                {end.bairro} - {end.cidade}/{end.estado}<br />
                <span className="text-zinc-400">CEP: {end.cep}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  onClick={() => handleDelete(end.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Endereço */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 font-heading">Novo Endereço</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Apelido</label>
                  <select
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="Casa">Casa</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">CEP *</label>
                  <input
                    type="text"
                    required
                    value={cep}
                    onChange={(e) => handleCEP(e.target.value)}
                    placeholder="00000-000"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Rua / Logradouro *</label>
                <input
                  type="text"
                  required
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  placeholder="Ex: Av. Paulista"
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Número *</label>
                  <input
                    type="text"
                    required
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="123"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Apto 42, Bloco B"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Centro"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    value={`${cidade}/${estado}`}
                    disabled
                    className="w-full text-xs p-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="principalCheck"
                  checked={principal}
                  onChange={(e) => setPrincipal(e.target.checked)}
                  className="rounded border-zinc-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="principalCheck" className="text-xs text-zinc-700 font-semibold cursor-pointer">
                  Definir como endereço principal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} size="sm" className="gap-1.5">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Salvar...' : 'Salvar Endereço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
