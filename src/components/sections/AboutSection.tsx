'use client';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';

export function AboutSection() {
  // Ideally these come from a `paginas` or `configuracoes` table.
  // For the sake of the CMS MVP, we'll assume they are stored in `paginas` slug='sobre'
  // and passed via props, or hardcoded with an ID for the CMS to edit.
  // For now, I'll mock the ID to "sobre" if it's stored in a dedicated row, 
  // or use the configuracoes table since it's global.
  
  // Actually, we created a `paginas` table. Let's assume the parent passes the content.
  // Since we don't have props defined yet for About, we'll fetch from config or use static ID.
  
  return (
    <section id="sobre" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-100 shadow-xl">
            <EditableImage
              src="/ambiente-placeholder.jpg"
              table="configuracoes"
              field="about_imagem" // assuming we added this to config, or it's just static for now
              id="1"
              bucket="gallery"
              className="w-full h-full"
            >
              <img 
                src="/ambiente-placeholder.jpg" 
                alt="Ambiente do Quiosque" 
                className="w-full h-full object-cover"
              />
            </EditableImage>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900 font-heading tracking-tight leading-tight">
              Tradição, sabor e <span className="text-[var(--color-primary)]">encontro entre amigos.</span>
            </h2>
            
            <div className="space-y-4 text-zinc-600 text-lg leading-relaxed">
              <p>
                O Quiosque da Praça nasceu para reunir amigos e famílias em um ambiente descontraído, oferecendo lanches, porções, espetinhos e bebidas com qualidade e ótimo atendimento.
              </p>
              <p>
                Estamos localizados em Campinas e buscamos proporcionar uma experiência agradável para quem quer comer bem e aproveitar bons momentos.
              </p>
            </div>
            
            <div className="pt-4 flex gap-4">
              <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-primary)]/20 flex-1 text-center">
                <span className="block text-3xl font-black text-[var(--color-primary)] font-heading mb-1">+5</span>
                <span className="text-sm font-semibold text-zinc-700">Anos de Tradição</span>
              </div>
              <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-primary)]/20 flex-1 text-center">
                <span className="block text-3xl font-black text-[var(--color-primary)] font-heading mb-1">10k</span>
                <span className="text-sm font-semibold text-zinc-700">Clientes Satisfeitos</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
