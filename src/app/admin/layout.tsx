import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 1. Unauthenticated Visitor: Redirect to login immediately without rendering dashboard HTML
  if (authError || !user) {
    redirect('/login?redirect=/admin');
  }

  // 2. Authenticated Session: Verify explicit administrator role in database
  let role = (user.user_metadata as any)?.role || 'customer';
  let isActive = true;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      role = profile.role || role;
      isActive = profile.is_active ?? true;
    }
  } catch {
    // Database lookup fallback
  }

  // Explicit administrator authorization for designated admin mobile
  const userPhone = (user.phone || (user.user_metadata as any)?.phone || '').replace(/[^0-9]/g, '');
  if (userPhone.endsWith('9235222399')) {
    role = 'admin';
    isActive = true;
  }

  // 3. Authenticated Non-Admin (Customer / Supplier / Inactive): Deny access with 403 Forbidden
  if (role !== 'admin' || !isActive) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-red-950/80 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-800">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">403 Forbidden: Administrator Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your authenticated account ({user.phone || user.email || user.id}) is registered with the role <span className="font-semibold text-amber-400">&quot;{role}&quot;</span>.
            Access to the NirmanSetu operations dashboard is restricted strictly to authorized platform administrators.
          </p>
          <div className="pt-3 flex flex-col gap-2">
            <Link
              href="/"
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>
            <Link
              href="/login?redirect=/admin"
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Sign In With Different Mobile Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Administrator: Render dashboard
  return <>{children}</>;
}
