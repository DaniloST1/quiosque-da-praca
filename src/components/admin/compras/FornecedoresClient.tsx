'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Edit2, Phone, Mail, MapPin, X } from 'lucide-react';

interface Fornecedor {
  id: string; nome: string; telefone: string | null; whatsapp: string | null;
  email: string | null; endereco: string | null; observacoes: string | null;
  ativo: boolean;
}

export function FornecedoresClient() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    nome: '', telefone: '', whatsapp: '', email: '', endereco: '', observacoes: ''
  });

  const fetchFornecedores = async () => {
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    if (data) setFornecedores(data);
    setLoading(false);
  };

  useEffect(() => { fetchFornecedores(); }, []);

  const handleEdit = (f: Fornecedor) => {
    setForm({
      nome: f.nome, telefone: f.telefone || '', whatsapp: f.whatsapp || '',
      email: f.email || '', endereco: f.endereco || '', observacoes: f.observacoes || ''
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      telefone: form.telefone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      endereco: form.endereco || null,
      observacoes: form.observacoes || null
    };

    if (editingId) {
      await supabase.from('fornecedores').update(payload).eq('id', editingId);
    } else {
      await supabase.from('fornecedores').insert(payload);
    }
    
    setShowForm(false);
    setEditingId(null);
    setForm({ nome: '', telefone: '', whatsapp: '', email: '', endereco: '', observacoes: '' });
    fetchFornecedores();
  };

  const toggleAtivo = async (id: string, ativoAtual: boolean) => {
    await supabase.from('fornecedores').update({ ativo: !ativoAtual }).eq('id', id);
    fetchFornecedores();
  };

  const filtrados = fornecedores.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Fornecedores</h1>
          <p className="text-zinc-500 mt-1">Gestão de parceiros e atacadistas</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ nome: '', telefone: '', whatsapp: '', email: '', endereco: '', observacoes: '' }); setShowForm(true); }} className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90">
          <Plus className="w-4 h-4" /> Novo Fornecedor
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-zinc-400 p-4">Carregando fornecedores...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-zinc-400 p-4">Nenhum fornecedor encontrado.</p>
        ) : (
          filtrados.map(f => (
            <div key={f.id} className={`bg-white rounded-2xl border p-5 shadow-sm relative ${!f.ativo ? 'opacity-50 border-zinc-200' : 'border-zinc-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-zinc-900">{f.nome}</h3>
                <div className="flex gap-2">
                  <button onClick={() => toggleAtivo(f.id, f.ativo)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 underline">{f.ativo ? 'Desativar' : 'Ativar'}</button>
                  <button onClick={() => handleEdit(f)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100"><Edit2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-zinc-600">
                {(f.telefone || f.whatsapp) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-400" /> {f.whatsapp || f.telefone}
                  </div>
                )}
                {f.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" /> {f.email}
                  </div>
                )}
                {f.endereco && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{f.endereco}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-5">
              <h3 className="text-lg font-bold">{editingId ? 'Editar' : 'Novo'} Fornecedor</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <form onSubmit={salvar} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Nome / Empresa *</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Telefone</label>
                <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">WhatsApp</label>
                <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Endereço Completo</label>
                <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-zinc-700 mb-1 block">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-zinc-200 rounded-xl py-2.5 text-sm font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-[var(--color-primary)] text-white rounded-xl py-2.5 text-sm font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
