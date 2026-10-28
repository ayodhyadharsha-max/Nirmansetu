'use client';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * Returns authorization headers for authenticated client-side API requests.
 * Uses the active Supabase browser session access token.
 */
export async function getBrowserAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Non-fatal if session unavailable
  }
  return headers;
}
