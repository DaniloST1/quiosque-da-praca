import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables missing. Using demo mode.');
}

// Browser client (singleton) – used by client components and hooks
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Server-side admin client (uses service role — only in API routes/server components)
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Using demo mode for admin client.');
  }
  
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    serviceRoleKey || 'placeholder-service-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
