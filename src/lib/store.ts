'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Produto } from '@/types/database';

// ─── Cart Store ──────────────────────────────────────────────
export interface CartItem {
  instanceId: string;
  produto: Produto;
  quantidade: number;
  removidos?: { id: string; nome: string }[];
  adicionais?: { id: string; nome: string; preco: number }[];
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (produto: Produto, removidos?: { id: string; nome: string }[], adicionais?: { id: string; nome: string; preco: number }[]) => void;
  removeItem: (instanceId: string) => void;
  updateQuantity: (instanceId: string, quantidade: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
}

// Função utilitária para gerar hash único baseado no produto e personalizações
const generateInstanceId = (produtoId: string, removidos: any[] = [], adicionais: any[] = []) => {
  const remStr = removidos.map(r => r.id).sort().join(',');
  const addStr = adicionais.map(a => a.id).sort().join(',');
  return `${produtoId}|${remStr}|${addStr}`;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (produto, removidos = [], adicionais = []) => {
        const items = get().items;
        const instanceId = generateInstanceId(produto.id, removidos, adicionais);
        const existing = items.find((i) => i.instanceId === instanceId);
        
        if (existing) {
          set({
            items: items.map((i) =>
              i.instanceId === instanceId
                ? { ...i, quantidade: i.quantidade + 1 }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...items, { instanceId, produto, quantidade: 1, removidos, adicionais }], isOpen: true });
        }
      },
      removeItem: (instanceId) =>
        set({ items: get().items.filter((i) => i.instanceId !== instanceId) }),
      updateQuantity: (instanceId, quantidade) => {
        if (quantidade <= 0) {
          get().removeItem(instanceId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.instanceId === instanceId ? { ...i, quantidade } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      total: () => {
        return get().items.reduce((acc, item) => {
          const valorAdicionais = (item.adicionais || []).reduce((sum, adic) => sum + Number(adic.preco), 0);
          const precoUnitario = Number(item.produto.preco) + valorAdicionais;
          return acc + precoUnitario * item.quantidade;
        }, 0);
      },
    }),
    {
      name: 'quiosque-cart',
    }
  )
);

// ─── CMS Store ────────────────────────────────────────────────
interface CMSStore {
  isEditMode: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  currentUserId: string | null;
  currentUserRole: string | null;
  setEditMode: (val: boolean) => void;
  setSaving: (val: boolean) => void;
  setLastSaved: (date: Date) => void;
  setUser: (id: string | null, role: string | null) => void;
}

export const useCMSStore = create<CMSStore>()((set) => ({
  isEditMode: false,
  isSaving: false,
  lastSaved: null,
  currentUserId: null,
  currentUserRole: null,
  setEditMode: (val) => set({ isEditMode: val }),
  setSaving: (val) => set({ isSaving: val }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setUser: (id, role) => set({ currentUserId: id, currentUserRole: role }),
}));
