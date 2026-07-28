export type UserRole = 'super_admin' | 'admin' | 'editor';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export interface Usuario {
  id: string;
  nome: string | null;
  email: string;
  role: UserRole;
  ativo: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Configuracoes {
  id: string;
  nome_empresa: string;
  schema_type: string;
  cidade: string;
  endereco: string | null;
  cep: string | null;
  whatsapp_number: string;
  ifood_url: string | null;
  instagram_handle: string | null;
  horarios: HorarioItem[];
  ga_id: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  google_maps_embed_url: string | null;
  logo_principal: string | null;
  logo_escuro: string | null;
  logo_claro: string | null;
  logo_favicon: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  link_whatsapp_direto?: boolean;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  cor_fundo: string;
  cor_texto: string;
  created_at: string;
  updated_at: string;
}

export interface HorarioItem {
  dias: string[];
  abertura: string;
  fechamento: string;
}

export interface Tema {
  id: string;
  nome: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  cor_fundo: string;
  cor_texto: string;
  fonte_titulo: string;
  fonte_corpo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Seo {
  id: string;
  pagina: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  schema_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SecaoSite {
  id: string;
  chave: string;
  nome: string;
  visivel: boolean;
  updated_at: string;
}

export interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  imagem: string | null;
  media_tipo: 'imagem' | 'video';
  media_url_desktop: string | null;
  media_url_mobile: string | null;
  botao_principal_texto: string | null;
  botao_principal_link: string | null;
  botao_secundario_texto: string | null;
  botao_terciario_texto: string | null;
  botao_terciario_link: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string | null;
  slug: string;
  descricao: string | null;
  ordem: number;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdutoImagem {
  id: string;
  produto_id: string;
  imagem_url: string;
  nome_arquivo: string | null;
  favorita: boolean;
  ordem: number;
  created_at: string;
}

export interface Produto {
  id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  subcategoria: string | null;
  featured: boolean;
  best_seller: boolean;
  promotion: boolean;
  recommended: boolean;
  ativo: boolean;
  ordem: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  created_at: string;
  updated_at: string;
  categoria?: Categoria;
  imagens?: ProdutoImagem[];
}

export interface Combo {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface Promocao {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  validade: string | null;
  dia_semana: string | null;
  desconto_pct: number | null;
  ativa: boolean;
  ordem: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Avaliacao {
  id: string;
  nome: string;
  texto: string;
  nota: number;
  avatar_url: string | null;
  publicada: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface GaleriaItem {
  id: string;
  url: string;
  titulo: string | null;
  categoria: string;
  bucket_path: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: AuditAction;
  entity: string;
  entity_id: string | null;
  entity_nome: string | null;
  diff: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Revisao {
  id: string;
  entity: string;
  entity_id: string;
  version: number;
  snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface Pagina {
  id: string;
  slug: string;
  titulo: string | null;
  conteudo: Record<string, unknown> | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  publicada: boolean;
  created_at: string;
  updated_at: string;
}

export type PedidoStatus = 'novo' | 'em_preparo' | 'pronto' | 'aguardando_motoboy' | 'saiu_entrega' | 'entregue' | 'cancelado';

export interface Pedido {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_telefone: string | null;
  status: PedidoStatus;
  tipo: 'mesa' | 'delivery' | 'retirada';
  mesa_id: string | null;
  endereco: Record<string, any> | null;
  total: number;
  
  // Tracking
  created_at: string;
  preparo_em: string | null;
  pronto_em: string | null;
  aguardando_motoboy_em: string | null;
  saiu_entrega_em: string | null;
  entregue_em: string | null;
  cancelado_em: string | null;
  tempo_preparo_minutos: number | null;
  tempo_entrega_minutos: number | null;
  
  motoboy_id: string | null;
  updated_at: string;
}

export interface Mesa {
  id: string;
  numero: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta';
  qr_token: string;
  created_at: string;
}

export interface WhatsappConfig {
  id: string;
  ativo: boolean;
  provider: 'evolution_api' | 'zapi' | 'meta_cloud';
  api_key: string | null;
  instance_id: string | null;
  numero_remetente: string | null;
  created_at: string;
  updated_at: string;
}

