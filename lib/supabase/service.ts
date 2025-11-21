import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

/**
 * Create a Supabase client with service role key
 * BYPASSES Row Level Security (RLS) - use with caution!
 * Only use for server-side operations that need to access all data
 * (e.g., cron jobs, admin operations)
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role credentials');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
