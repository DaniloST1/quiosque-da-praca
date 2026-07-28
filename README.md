# 🍽️ Quiosque da Praça — Documentação Técnica

Sistema completo de delivery/cardápio online com painel administrativo, portal do cliente e CMS visual integrado.

---

## 🗂️ Índice

1. [Stack Tecnológica](#1-stack-tecnológica)
2. [Variáveis de Ambiente](#2-variáveis-de-ambiente)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Banco de Dados](#4-banco-de-dados)
5. [Autenticação e Middleware](#5-autenticação-e-middleware)
6. [Landpage](#6-landpage)
7. [Portal do Cliente](#7-portal-do-cliente-minha-conta)
8. [Painel Administrativo](#8-painel-administrativo-admin)
9. [Cardápio para Mesa](#9-cardápio-para-mesa-mesa)
10. [KDS — Cozinha](#10-kds--cozinha-cozinha)
11. [API Routes](#11-api-routes)
12. [Estado Global Zustand](#12-estado-global-zustand)
13. [Sistema de Temas e CMS Visual](#13-sistema-de-temas-e-cms-visual)
14. [Bibliotecas Utilitárias](#14-bibliotecas-utilitárias-lib)
15. [Componentes por Categoria](#15-componentes-por-categoria)
16. [Executar Localmente](#16-executar-localmente)
17. [Deploy](#17-deploy)

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Runtime | React | 19.2.4 |
| Linguagem | TypeScript | ^5 |
| Estilização | Tailwind CSS | ^4 |
| Banco de Dados | Supabase (PostgreSQL) | ^2.110 |
| Auth SSR | @supabase/ssr | ^0.12.3 |
| Estado global | Zustand | ^5.0.14 |
| Animações | Framer Motion | ^12.42.2 |
| Drag-and-drop | @dnd-kit (core, sortable, utilities) | ^6 |
| Ícones | Lucide React | ^1.24.0 |
| Datas | date-fns | ^4.4.0 |
| CSV | papaparse | ^5.5.4 |
| Compressão de imagem | browser-image-compression | ^2.0.2 |
| Fontes | Google Fonts — Inter + Outfit | — |

---

## 2. Variáveis de Ambiente

Copie `.env.example` → `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> **IMPORTANTE:** `SUPABASE_SERVICE_ROLE_KEY` é usada apenas no servidor e nunca exposta ao navegador.

---

## 3. Estrutura de Diretórios

```
quiosque/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (providers, temas, GA/GTM)
│   │   ├── page.tsx                # Landpage principal
│   │   ├── globals.css             # CSS global + variáveis de tema
│   │   ├── admin/                  # Painel administrativo
│   │   │   ├── layout.tsx          # Layout admin (sidebar dark + auth guard)
│   │   │   ├── dashboard/          # KPIs e gráficos
│   │   │   ├── pedidos/            # Kanban de pedidos + comanda
│   │   │   ├── cardapio/           # Produtos, categorias, fichas técnicas
│   │   │   ├── estoque/            # Controle de estoque
│   │   │   ├── caixa/              # Relatório de caixa
│   │   │   ├── compras/            # Compras e fornecedores
│   │   │   ├── financeiro/         # Lançamentos e importações CSV
│   │   │   ├── lucratividade/      # Análise custo x receita
│   │   │   ├── clientes/           # Lista e detalhe de clientes
│   │   │   ├── mesas/              # Mesas e QR codes
│   │   │   ├── relatorios/         # Relatórios gerenciais
│   │   │   ├── backups/            # Backup do banco em JSON
│   │   │   ├── logs/               # Audit logs
│   │   │   ├── permissoes/         # Usuários e roles
│   │   │   ├── vitrine/            # CMS da landpage
│   │   │   │   ├── banners/
│   │   │   │   ├── cardapio/
│   │   │   │   ├── promocoes/
│   │   │   │   ├── combos/
│   │   │   │   ├── galeria/
│   │   │   │   ├── mais-pedidos/
│   │   │   │   ├── avaliacoes/
│   │   │   │   ├── produtos-relacionados/
│   │   │   │   └── secoes/
│   │   │   ├── configuracoes/
│   │   │   │   ├── geral/          # Logo, cores, SEO, GA, GTM
│   │   │   │   └── whatsapp/       # Integração WhatsApp Business
│   │   │   ├── tema/               # Editor visual de tema
│   │   │   ├── preview/            # Preview da landpage
│   │   │   └── login/
│   │   ├── minha-conta/            # Portal do Cliente
│   │   │   ├── layout.tsx          # Header landpage + sidebar dark
│   │   │   ├── page.tsx            # Dashboard do cliente
│   │   │   ├── pedidos/            # Histórico + [id] realtime
│   │   │   ├── enderecos/          # Endereços salvos (ViaCEP)
│   │   │   ├── favoritos/          # Produtos favoritos
│   │   │   └── perfil/             # Perfil + alterar senha
│   │   ├── api/
│   │   │   ├── admin/delete/       # Deleção via service role
│   │   │   ├── auth/signout/       # Logout admin
│   │   │   ├── clientes/buscar/    # Busca por telefone
│   │   │   ├── clientes/upsert/    # Criar/atualizar cliente
│   │   │   ├── cron/whatsapp/      # Cron de mensagens WhatsApp
│   │   │   └── revalidate/         # Revalidação de cache
│   │   ├── auth/callback/          # OAuth callback (Google)
│   │   ├── avaliar/[id]/           # Avaliação pública de pedido
│   │   ├── mesa/[token]/           # Cardápio via QR code
│   │   └── cozinha/                # KDS da cozinha
│   ├── components/
│   │   ├── layout/                 # Header, Footer, CartDrawer, UserMenu
│   │   ├── sections/               # Seções da landpage (11 seções)
│   │   ├── ui/                     # Button, Modal, CheckoutModal, etc.
│   │   ├── admin/                  # Componentes do painel
│   │   ├── auth/                   # AuthModal
│   │   ├── cms/                    # CMS visual (EditableText, etc.)
│   │   ├── conta/                  # MinhaContaSidebar
│   │   ├── cozinha/                # CozinhaKDS
│   │   └── mesa/                   # MesaCardapio
│   ├── context/
│   │   └── AuthContext.tsx         # Auth global do cliente final
│   ├── hooks/
│   │   ├── useBusinessHours.ts     # Verifica horário de funcionamento
│   │   └── useCMS.ts               # Edição inline CMS
│   ├── lib/
│   │   ├── supabase.ts             # Clientes Supabase (anon + service role)
│   │   ├── theme.ts                # getConfig, getActiveTheme, buildThemeCSSVars
│   │   ├── store.ts                # Zustand (carrinho + CMS)
│   │   ├── permissions.ts          # Controle de acesso por role
│   │   ├── audit.ts                # Logs de auditoria
│   │   ├── revisions.ts            # Histórico de revisões CMS
│   │   ├── storage.ts              # Upload para Supabase Storage
│   │   ├── adminDelete.ts          # Deleção com service role
│   │   ├── phoneUtils.ts           # Máscara telefone BR
│   │   └── utils.ts                # Helpers gerais
│   ├── types/
│   │   ├── database.ts             # Tipos TypeScript do banco
│   │   └── cms.ts                  # Tipos do CMS
│   └── proxy.ts                    # Middleware (protege /admin/*)
├── supabase/                       # Migrations SQL
│   ├── schema.sql                  # Schema base
│   ├── schema_v3_*.sql             # Fase 3 (cardápio, estoque, pedidos...)
│   ├── schema_v4_phase7.sql        # Fase 4 (financeiro, lucratividade)
│   ├── schema_v5_clientes.sql      # Fase 5 (tabela clientes)
│   └── schema_v6_portal_cliente.sql # Fase 6 (portal, auth, endereços, favoritos)
└── public/                         # Assets estáticos
```

---

## 4. Banco de Dados

Hospedado no **Supabase (PostgreSQL)**.

### Principais Tabelas

| Tabela | Descrição |
|---|---|
| `configuracoes` | Configurações globais (nome, logo, cores, WhatsApp, GA, GTM) |
| `temas` | Temas visuais (paleta de cores, tipografia) |
| `secoes_site` | Ordem e visibilidade de cada seção da landpage |
| `seo` | Meta tags por página (title, description, OG) |
| `banners` | Banners do hero carousel |
| `categorias` | Categorias do cardápio |
| `produtos` | Produtos com preço, imagens, ingredientes removíveis, adicionais |
| `produto_imagens` | Galeria de imagens por produto |
| `combos` | Combos com produtos inclusos |
| `promocoes` | Promoções da semana |
| `mais_pedidos` | Pódio dos mais pedidos (posição 1–3) |
| `galeria` | Fotos da galeria |
| `avaliacoes` | Avaliações de clientes publicadas |
| `pedidos` | Pedidos com status, tipo (delivery/mesa/retirada), itens JSON |
| `pedido_itens` | Itens individuais de cada pedido |
| `mesas` | Mesas com token único para QR code |
| `estoque` | Movimentações de entrada/saída de ingredientes |
| `compras` | Ordens de compra com fornecedores |
| `fornecedores` | Cadastro de fornecedores |
| `lancamentos_financeiros` | Lançamentos de receita e despesa |
| `fichas_tecnicas` | Relação produto → ingredientes e quantidades |
| `admin_users` | Usuários administradores com roles |
| `audit_logs` | Log de todas as ações administrativas |
| `revisoes_conteudo` | Histórico de edições CMS |
| `clientes` | Clientes registrados (nome, telefone, e-mail, foto, pontos) |
| `cliente_enderecos` | Endereços salvos por cliente (flag `principal`) |
| `cliente_favoritos` | Produtos favoritados por cliente |
| `cupons` | Cupons de desconto/cashback |
| `cliente_cupons` | Relacionamento cliente ↔ cupom |
| `whatsapp_mensagens` | Fila de mensagens para WhatsApp Business |

### Triggers

| Trigger | Função | Evento |
|---|---|---|
| `trg_on_auth_user_created` | `fn_handle_new_user()` | Após INSERT em `auth.users` — sincroniza com `public.clientes` |
| `trg_ensure_single_principal` | `fn_ensure_single_principal_address()` | Garante único endereço `principal = true` por cliente |

### Row Level Security (RLS)

- `cliente_enderecos` e `cliente_favoritos`: acesso restrito ao próprio cliente via `auth_user_id`.
- `service_role` tem acesso irrestrito para operações server-side.

---

## 5. Autenticação e Middleware

### Middleware (`src/proxy.ts`)
- Intercepta `/admin/*` e verifica sessão Supabase via cookie (SSR-safe com `@supabase/ssr`).
- Redireciona para `/admin/login` se não autenticado.
- Redireciona para `/admin` se já logado e tentar acessar `/admin/login`.

### AuthContext (`src/context/AuthContext.tsx`)
Context global que gerencia autenticação do **cliente final**:
- `user` — objeto Supabase Auth.
- `cliente` — dados de `public.clientes`.
- `isAuthModalOpen` / `openAuthModal()` / `closeAuthModal()`.
- `refreshCliente()` — recarrega após edição de perfil.

### AuthModal (`src/components/auth/AuthModal.tsx`)
Modal com 3 modos:
1. **Login** — e-mail + senha ou Google OAuth.
2. **Cadastro** — nome, telefone (máscara BR), e-mail, senha.
3. **Recuperar Senha** — e-mail de redefinição.

---

## 6. Landpage

**Rota:** `/` | **Arquivo:** `src/app/page.tsx` (Server Component)

Busca todas as entidades em paralelo com `Promise.all` e renderiza seções dinamicamente conforme ordem e visibilidade em `secoes_site`.

### Seções Disponíveis

| Chave | Componente | Descrição |
|---|---|---|
| `hero` | `HeroSection` | Carousel de banners, CTA WhatsApp/iFood |
| `promocoes` | `PromotionsSection` | Cards de promoções com carousel responsivo |
| `mais_pedidos` | `BestSellersSection` | Pódio 1º/2º/3º mais pedidos |
| `cardapio` | `MenuSection` | Cardápio com filtro por categoria e busca |
| `combos` | `CombosSection` | Cards de combos |
| `montar_pedido` | `OrderBuilder` | Montador de pedido personalizado |
| `galeria` | `GallerySection` | Galeria com lightbox |
| `contato` | `AboutSection` | Sobre o estabelecimento |
| `avaliacoes` | `ReviewsSection` | Depoimentos de clientes |
| `mapa` | `LocationSection` | Google Maps embed + endereço |

### Componentes Fixos

**Header** — Logo editável via CMS, links de navegação dinâmicos, avatar do usuário (`UserMenu`), contador do carrinho, botão "Fazer Pedido". Responsivo com menu hambúrguer.

**CartDrawer** — Drawer lateral com itens, personalização (removidos/adicionais), total em tempo real. "Finalizar Pedido" abre `CheckoutModal` (ou `AuthModal` se não logado).

**CheckoutModal** — Formulário de checkout. Se logado: pré-preenche dados e lista endereços salvos. Tipos: Delivery, Retirada. Envia pedido via WhatsApp e cria registro em `pedidos`.

---

## 7. Portal do Cliente (`/minha-conta`)

Layout: header da landpage + sidebar dark idêntica ao painel admin.

### Rotas

| Rota | Descrição |
|---|---|
| `/minha-conta` | Dashboard — métricas, pontos de fidelidade, ações rápidas |
| `/minha-conta/pedidos` | Histórico com status e badges coloridos |
| `/minha-conta/pedidos/[id]` | Timeline realtime (Supabase Realtime) + "Pedir Novamente" |
| `/minha-conta/enderecos` | CRUD de endereços com busca por CEP (ViaCEP) |
| `/minha-conta/favoritos` | Produtos favoritos com "Pedir" direto |
| `/minha-conta/perfil` | Edição de dados + alterar senha (layout 2 colunas) |

### MinhaContaSidebar (`src/components/conta/MinhaContaSidebar.tsx`)
- Fundo `zinc-900`, borda primária lateral — idêntico ao painel admin.
- Avatar (foto ou iniciais) + nome + cargo "Cliente".
- Links ativos com `bg-[primary] text-white`.
- Desktop: sidebar fixa; Mobile: abas horizontais roláveis.
- Botão Sair vermelho sólido no rodapé.

### Timeline de Pedidos
Usa `supabase.channel()` para receber mudanças em tempo real. 7 status:
`recebido` → `pagamento_confirmado` → `em_preparo` → `pronto_retirada` / `saiu_entrega` → `entregue` / `cancelado`

---

## 8. Painel Administrativo (`/admin`)

Proteção via Middleware. Layout: `src/app/admin/layout.tsx` com sidebar dark.

### Módulos

| Módulo | Rota | Descrição |
|---|---|---|
| Dashboard | `/admin/dashboard` | KPIs do dia, gráfico de vendas por hora, alertas |
| Pedidos | `/admin/pedidos` | Kanban drag-and-drop por status, filtros, comanda |
| Cardápio | `/admin/cardapio` | CRUD de categorias/produtos, imagens, adicionais, upsell |
| Vitrine | `/admin/vitrine` | CMS completo da landpage (banners, promoções, seções...) |
| Estoque | `/admin/estoque` | Movimentações entrada/saída, alertas de mínimo |
| Caixa | `/admin/caixa` | Resumo diário por forma de pagamento |
| Compras | `/admin/compras` | Ordens de compra e fornecedores |
| Financeiro | `/admin/financeiro` | Lançamentos e importação CSV |
| Lucratividade | `/admin/lucratividade` | Custo x receita por produto (fichas técnicas) |
| Clientes | `/admin/clientes` | Lista com tag "Conta Registrada", avatar, histórico |
| Mesas | `/admin/mesas` | Criação de mesas com QR code |
| Configurações | `/admin/configuracoes` | Logo, SEO, GA4, GTM, WhatsApp |
| Tema | `/admin/tema` | Editor visual de cores e fontes |
| Permissões | `/admin/permissoes` | Usuários admin com roles |
| Logs | `/admin/logs` | Audit logs filtraveis |
| Backups | `/admin/backups` | Download de dados em JSON |

---

## 9. Cardápio para Mesa (`/mesa`)

**Rota:** `/mesa/[token]`

Cardápio público via QR code. Identifica a mesa pelo `token` único. Pedido vinculado à mesa, sem delivery.

---

## 10. KDS — Cozinha (`/cozinha`)

**Rota:** `/cozinha`

Kitchen Display System. Mostra pedidos em aberto em tempo real via Supabase Realtime. Sem autenticação — tela fixa na cozinha.

---

## 11. API Routes

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/clientes/upsert` | POST | Cria ou atualiza cliente |
| `/api/clientes/buscar` | GET | Busca cliente por `?telefone=` |
| `/api/admin/delete` | POST | Deleção segura com service role |
| `/api/auth/signout` | POST | Logout admin (invalida cookie) |
| `/api/cron/whatsapp` | GET | Cron de envio de mensagens WhatsApp |
| `/api/revalidate` | POST | Revalida cache Next.js por tag |

---

## 12. Estado Global (Zustand)

### `useCart` — Carrinho
Persistido no `localStorage` (`quiosque-cart`).

| Método / Prop | Descrição |
|---|---|
| `items: CartItem[]` | Itens no carrinho |
| `isOpen: boolean` | Drawer aberto |
| `addItem(produto, removidos?, adicionais?)` | Agrupa por `instanceId` (hash produto+personalizações) |
| `removeItem(instanceId)` | Remove item |
| `updateQuantity(instanceId, qty)` | Atualiza (0 = remove) |
| `clearCart()` | Esvazia |
| `total()` | Total incluindo adicionais |

### `useCMSStore` — CMS

| Prop | Descrição |
|---|---|
| `isEditMode` | Modo de edição ativo |
| `isSaving` | Estado de loading |
| `lastSaved` | Data/hora do último save |
| `currentUserId / currentUserRole` | Identidade do admin logado |

---

## 13. Sistema de Temas e CMS Visual

### Temas (`src/lib/theme.ts`)
- `getConfig()` — configurações do banco.
- `getActiveTheme()` — tema ativo.
- `buildThemeCSSVars(theme)` — gera CSS vars (`--color-primary`, `--color-bg`, `--font-heading`, etc.).
- Root Layout injeta as vars no `<head>` via `<style dangerouslySetInnerHTML>`.

### CMS Visual
- **CMSProvider** — barra flutuante com toggle "Modo de Edição", "Painel", "Visualizar Site", "Sair".
- **EditableText** — `<span>` editável inline no modo CMS.
- **EditableImage** — imagem com overlay de edição.
- **SectionVisibilityToggle** — wrapper com toggle de visibilidade por seção.
- **useCMS** hook — salva edições no banco e dispara revalidação de cache.

---

## 14. Bibliotecas Utilitárias (`/lib`)

| Arquivo | Exports | Descrição |
|---|---|---|
| `supabase.ts` | `supabase`, `createAdminClient` | Cliente anon (browser) + service role (server) |
| `theme.ts` | `getConfig`, `getActiveTheme`, `buildThemeCSSVars` | Sistema de temas dinâmicos |
| `store.ts` | `useCart`, `useCMSStore` | Stores Zustand |
| `permissions.ts` | `hasPermission(role, module)` | Controle de acesso por role |
| `audit.ts` | `logAction(...)` | Grava em `audit_logs` |
| `revisions.ts` | `saveRevision(...)` | Snapshot de conteúdo antes de editar |
| `storage.ts` | `uploadImage(...)` | Upload comprimido para Supabase Storage |
| `adminDelete.ts` | `adminDelete(table, id)` | Deleção com service role via API |
| `phoneUtils.ts` | `formatPhoneBR(raw)`, `unformatPhone(masked)` | Máscara telefone BR `(99) 9 9999-9999` |
| `utils.ts` | Helpers | Formatação de moeda, datas, slugify, etc. |

---

## 15. Componentes por Categoria

### Layout
`Header` · `Footer` · `CartDrawer` · `UserMenu`

### Seções da Landpage
`HeroSection` · `StatusSection` · `PromotionsSection` · `BestSellersSection` · `MenuSection` · `CombosSection` · `OrderBuilder` · `GallerySection` · `AboutSection` · `ReviewsSection` · `LocationSection`

### UI Genérico
`Button` · `Badge` · `Card` · `Modal` · `ProdutoModal` · `CheckoutModal` · `FavoriteButton` · `ImageUploader` · `Lightbox` · `DragList` · `DragScrollHandler`

### Auth
`AuthModal`

### Portal do Cliente
`MinhaContaSidebar`

---

## 16. Executar Localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Desenvolvimento
npm run dev
# → http://localhost:3000

# Build de produção
npm run build
npm start
```

### Aplicar Migrations no Supabase

Execute no **SQL Editor** do Supabase na seguinte ordem:

1. `schema.sql`
2. `schema_v3_migration.sql` → `phase2` → `phase3` → `phase4` → `phase5` → `phase6` → `phase6_1` → `phase6_galeria`
3. `schema_v4_phase7.sql`
4. `schema_v4_phase8_trigger_fix.sql`
5. `schema_v5_clientes.sql`
6. `schema_v6_portal_cliente.sql`

---

## 17. Deploy

Compatível com **Vercel** (recomendado) ou qualquer plataforma Node.js.

### Variáveis de Produção

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Google OAuth

1. Supabase: **Authentication → Providers → Google** → ative e insira Client ID e Secret.
2. Google Cloud Console: crie OAuth 2.0 Client ID (Web App) com Redirect URL:
   ```
   https://<seu-projeto>.supabase.co/auth/v1/callback
   ```

### Cron WhatsApp

Configure `/api/cron/whatsapp` para ser chamado externamente (Vercel Cron, GitHub Actions, etc.).

---

*Documentação atualizada em: Julho 2025*
