import Link from 'next/link';
import { 
  Image as ImageIcon, 
  Tag, 
  Package, 
  Trophy, 
  Utensils, 
  ImagePlus, 
  MessageSquare,
  Sparkles,
  Eye
} from 'lucide-react';

const modules = [
  { name: 'Hero Banner', icon: ImageIcon, href: '/admin/vitrine/banners', desc: 'Gerenciar imagens e vídeos de destaque' },
  { name: 'Promoções', icon: Tag, href: '/admin/vitrine/promocoes', desc: 'Gerenciar itens em promoção na semana' },
  { name: 'Combos Especiais', icon: Package, href: '/admin/vitrine/combos', desc: 'Ofertas de combos e kits' },
  { name: 'Os Mais Pedidos', icon: Trophy, href: '/admin/vitrine/mais-pedidos', desc: 'Configurar o pódio de destaques' },
  { name: 'Nosso Cardápio', icon: Utensils, href: '/admin/vitrine/cardapio', desc: 'Gerenciar todos os produtos e categorias' },
  { name: 'Produtos Relacionados (Upsell)', icon: Sparkles, href: '/admin/vitrine/produtos-relacionados', desc: 'Sugerir produtos extras no momento da compra' },
  { name: 'Galeria', icon: ImagePlus, href: '/admin/vitrine/galeria', desc: 'Gerenciar fotos do estabelecimento' },
  { name: 'Avaliações', icon: MessageSquare, href: '/admin/vitrine/avaliacoes', desc: 'Depoimentos de clientes' },
  { name: 'Visibilidade das Seções', icon: Eye, href: '/admin/vitrine/secoes', desc: 'Ativar ou ocultar blocos da página inicial' },
];

export default function VitrinePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Vitrine do Site</h1>
        <p className="text-zinc-500 mt-1">Gerencie todo o conteúdo exibido na página inicial e no cardápio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <Link 
            key={mod.name} 
            href={mod.href}
            className="flex flex-col bg-white p-6 rounded-xl border border-zinc-200 hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
              <mod.icon className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-zinc-900">{mod.name}</h2>
            <p className="text-sm text-zinc-500 mt-1">{mod.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
