import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const cookieStore = await cookies();
  
  // Limpa o cookie de edição
  cookieStore.set('is_edit_mode', 'false', { path: '/' });
  
  // Redireciona para o site
  redirect('/');
}
