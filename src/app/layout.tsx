import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { CMSProvider } from '@/components/cms/CMSProvider';
import { DragScrollHandler } from '@/components/ui/DragScrollHandler';
import { getActiveTheme, buildThemeCSSVars, getConfig } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export async function generateMetadata(): Promise<Metadata> {
  const { data: seo } = await supabase.from('seo').select('*').eq('pagina', 'home').single();
  const config = await getConfig();

  return {
    title: seo?.meta_title || `${config.nome_empresa} | O Sabor que Reúne`,
    description: seo?.meta_description || 'Os melhores lanches, porções e espetinhos.',
    openGraph: {
      title: seo?.og_title || seo?.meta_title || config.nome_empresa,
      description: seo?.og_description || seo?.meta_description,
      images: seo?.og_image || config.logo_principal ? [seo?.og_image || config.logo_principal!] : [],
    },
    icons: {
      icon: config.logo_favicon || '/favicon.ico',
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getActiveTheme();
  const cssVars = buildThemeCSSVars(theme);
  const config = await getConfig();

  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {config.ga_id && (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${config.ga_id}`}></script>
        )}
        {config.ga_id && (
          <script dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${config.ga_id}');
            `
          }} />
        )}
        {config.gtm_id && (
          <script dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${config.gtm_id}');`
          }} />
        )}
      </head>
      <body className="font-body text-[var(--color-text)] bg-[var(--color-bg)] antialiased min-h-screen flex flex-col">
        {config.gtm_id && (
          <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${config.gtm_id}`} height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
        )}
        
        <AuthProvider>
          <CMSProvider>
            {children}
          </CMSProvider>
          <AuthModal />
          <DragScrollHandler />
        </AuthProvider>
      </body>
    </html>
  );
}
