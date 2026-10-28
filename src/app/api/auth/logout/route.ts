import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors
  }
  const url = new URL('/login?redirect=/admin', req.url);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors
  }
  const { searchParams } = new URL(req.url);
  const redirectTarget = searchParams.get('redirect') || '/admin';
  const url = new URL(`/login?redirect=${encodeURIComponent(redirectTarget)}`, req.url);
  return NextResponse.redirect(url);
}
