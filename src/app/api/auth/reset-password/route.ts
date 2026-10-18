import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ResetPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    try {
      const supabase = createServerSupabaseClient();
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?reset=true`,
      });
    } catch {
      // Handled
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Password reset failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
