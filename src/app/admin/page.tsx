import { Card } from '@/components/ui/Card';
import { createAdminClient } from '@/lib/supabase';
import { Box, ImageIcon, ShoppingBag, Star, Layout } from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  
  const [
    { count: produtosCount },
    { count: promocoesCount },
    { count: bannersCount },
    { count: avaliacoesCount }
  ] = await Promise.all([
    supabase.from('produtos').select('*', { count: 'exact', head: true }),
    supabase.from('promocoes').select('*', { count: 'exact', head: true }),
    supabase.from('banners').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { title: 'Produtos Cadastrados', value: produtosCount || 0, icon: Box, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Promoções Ativas', value: promocoesCount || 0, icon: ShoppingBag, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Banners no Site', value: bannersCount || 0, icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-100' },
    { title: 'Avaliações', value: avaliacoesCount || 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-100' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Painel Administrativo</h1>
        <p className="text-zinc-500">
          Bem-vindo! Para editar o conteúdo do site visualmente, volte à página inicial e clique em "Modo de Edição" na barra inferior.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 flex items-center gap-4 border-none shadow-sm">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">{stat.title}</p>
              <h3 className="text-2xl font-black text-zinc-900">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 shadow-sm border-none">
          <div className="flex items-center gap-3 mb-6">
            <Layout className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-bold text-zinc-900">Como usar o CMS Visual?</h2>
          </div>
          <div className="space-y-4 text-zinc-600">
            <p>1. Volte para a página inicial clicando no botão no menu lateral.</p>
            <p>2. Na barra flutuante na parte inferior da tela, ative o <strong>Modo de Edição</strong>.</p>
            <p>3. Passe o mouse sobre textos ou imagens para ver o contorno de edição.</p>
            <p>4. Clique em textos para editar diretamente (salva ao clicar fora) ou em imagens para fazer upload.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
