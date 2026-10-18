import { createClient } from '@supabase/supabase-js';

/**
 * PRIVILEGED ADMIN CLIENT (SERVER-SIDE ONLY)
 *
 * Uses the Supabase Service Role Key to bypass RLS for administrative mutations,
 * webhook processing, audit logging, and supplier dispatch assignments.
 *
 * CRITICAL SECURITY: Never import or call this function in a Client Component!
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: createAdminClient cannot be called from the browser.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in server environment.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
