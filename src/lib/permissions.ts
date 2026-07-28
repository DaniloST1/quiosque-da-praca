import { UserRole } from '@/types/database';

type Action =
  // Content (all roles)
  | 'produtos:read' | 'produtos:write' | 'produtos:delete'
  | 'categorias:read' | 'categorias:write' | 'categorias:delete'
  | 'combos:read' | 'combos:write' | 'combos:delete'
  | 'banners:read' | 'banners:write' | 'banners:delete'
  | 'promocoes:read' | 'promocoes:write' | 'promocoes:delete'
  | 'galeria:read' | 'galeria:write' | 'galeria:delete'
  | 'avaliacoes:read' | 'avaliacoes:write' | 'avaliacoes:delete'
  // Admin only
  | 'configuracoes:read' | 'configuracoes:write'
  | 'tema:read' | 'tema:write'
  | 'seo:read' | 'seo:write'
  | 'logs:read'
  | 'revisoes:read' | 'revisoes:restore'
  // Super admin only
  | 'usuarios:read' | 'usuarios:write' | 'usuarios:delete'
  | 'backup:export';

const PERMISSIONS: Record<UserRole, Action[]> = {
  super_admin: [
    'produtos:read', 'produtos:write', 'produtos:delete',
    'categorias:read', 'categorias:write', 'categorias:delete',
    'combos:read', 'combos:write', 'combos:delete',
    'banners:read', 'banners:write', 'banners:delete',
    'promocoes:read', 'promocoes:write', 'promocoes:delete',
    'galeria:read', 'galeria:write', 'galeria:delete',
    'avaliacoes:read', 'avaliacoes:write', 'avaliacoes:delete',
    'configuracoes:read', 'configuracoes:write',
    'tema:read', 'tema:write',
    'seo:read', 'seo:write',
    'logs:read',
    'revisoes:read', 'revisoes:restore',
    'usuarios:read', 'usuarios:write', 'usuarios:delete',
    'backup:export',
  ],
  admin: [
    'produtos:read', 'produtos:write', 'produtos:delete',
    'categorias:read', 'categorias:write', 'categorias:delete',
    'combos:read', 'combos:write', 'combos:delete',
    'banners:read', 'banners:write', 'banners:delete',
    'promocoes:read', 'promocoes:write', 'promocoes:delete',
    'galeria:read', 'galeria:write', 'galeria:delete',
    'avaliacoes:read', 'avaliacoes:write', 'avaliacoes:delete',
    'configuracoes:read', 'configuracoes:write',
    'tema:read', 'tema:write',
    'seo:read', 'seo:write',
    'logs:read',
    'revisoes:read', 'revisoes:restore',
  ],
  editor: [
    'produtos:read', 'produtos:write',
    'categorias:read',
    'combos:read', 'combos:write',
    'banners:read', 'banners:write',
    'promocoes:read', 'promocoes:write',
    'galeria:read', 'galeria:write', 'galeria:delete',
    'avaliacoes:read', 'avaliacoes:write',
  ],
};

export function can(role: UserRole | null | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(action) ?? false;
}

export function requireRole(role: UserRole | null | undefined, action: Action): void {
  if (!can(role, action)) {
    throw new Error(`Permission denied: ${action}`);
  }
}
