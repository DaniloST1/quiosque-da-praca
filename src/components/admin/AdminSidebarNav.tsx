'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  History,
  Database,
  Paintbrush,
  ShieldCheck,
  Store,
  Package,
  TableProperties,
  ChefHat,
  MessageCircle,
  BarChart2,
  Boxes,
  DollarSign,
  CreditCard,
  FileText,
  ShoppingCart,
  MapPin,
  Eye,
  Users,
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: { label: string; href: string; icon: any; exact?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Operações',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Pedidos', href: '/admin/pedidos', icon: Package },
      { label: 'Mesas', href: '/admin/mesas', icon: TableProperties },
      { label: 'Caixa', href: '/admin/caixa', icon: CreditCard },
      { label: 'Cozinha KDS', href: '/cozinha', icon: ChefHat },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { label: 'Vitrine (Site)', href: '/admin/vitrine', icon: Store },
      { label: 'Cardápio', href: '/admin/vitrine/cardapio', icon: FileText },
      { label: 'Visibilidade', href: '/admin/vitrine/secoes', icon: Eye },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Clientes', href: '/admin/clientes', icon: Users },
      { label: 'Estoque', href: '/admin/estoque', icon: Boxes },
      { label: 'Compras', href: '/admin/compras', icon: ShoppingCart },
      { label: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
      { label: 'Lucratividade', href: '/admin/lucratividade', icon: BarChart2 },
      { label: 'Relatórios', href: '/admin/relatorios', icon: FileText },
      { label: 'WhatsApp', href: '/admin/configuracoes/whatsapp', icon: MessageCircle },
      { label: 'Endereço / Mapa', href: '/admin/configuracoes/geral', icon: MapPin },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Auditoria & Logs', href: '/admin/logs', icon: History },
      { label: 'Revisões', href: '/admin/backups', icon: Database },
      { label: 'Tema', href: '/admin/tema', icon: Paintbrush },
      { label: 'Permissões', href: '/admin/permissoes', icon: ShieldCheck },
    ],
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {navGroups.map(group => (
        <div key={group.label}>
          <p className="px-4 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(item => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && item.href !== '/admin';
              const isExactActive = item.exact && pathname === item.href;
              const active = isActive || isExactActive;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--color-primary)]' : 'text-zinc-400'}`} />
                  {item.label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
