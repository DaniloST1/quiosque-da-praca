export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function buildWhatsAppMessage(
  items: Array<{ nome: string; quantidade: number; preco: number }>,
  total: number,
  whatsappNumber: string
): string {
  const lines = items.map(
    (i) => `• ${i.quantidade}x ${i.nome} — ${formatCurrency(i.preco * i.quantidade)}`
  );
  const message = encodeURIComponent(
    `Olá! Gostaria de fazer um pedido:\n\n${lines.join('\n')}\n\n*Total: ${formatCurrency(total)}*`
  );
  return `https://wa.me/${whatsappNumber}?text=${message}`;
}

export function getDayOfWeek(): string {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[new Date().getDay()];
}

export function isOpen(
  horarios: Array<{ dias: string[]; abertura: string; fechamento: string }>
): boolean {
  const now = new Date();
  const day = getDayOfWeek();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const h of horarios) {
    if (!h.dias.includes(day)) continue;
    const [aH, aM] = h.abertura.split(':').map(Number);
    const [fH, fM] = h.fechamento.split(':').map(Number);
    const open = aH * 60 + aM;
    let close = fH * 60 + fM;
    // Handle midnight crossover (e.g. 19:00–00:00)
    if (close <= open) close += 24 * 60;
    const adjusted = close <= open ? currentMinutes + 24 * 60 : currentMinutes;
    if (adjusted >= open && adjusted < close) return true;
  }
  return false;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
