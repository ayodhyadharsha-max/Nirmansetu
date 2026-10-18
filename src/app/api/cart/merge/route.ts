import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mergeGuestCart } from '@/lib/cart/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const MergeCartSchema = z.object({
  guestSessionToken: z.string().min(1, 'Guest session token is required'),
  userId: z.string().min(1, 'User ID is required').optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = MergeCartSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let targetUserId = parsed.data.userId;

    if (!targetUserId) {
      // Check auth from session
      try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      } catch {
        // Handled
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User must be authenticated to merge guest cart' },
        { status: 401 }
      );
    }

    const res = await mergeGuestCart({
      guestSessionToken: parsed.data.guestSessionToken,
      userId: targetUserId,
    });

    return NextResponse.json({
      success: true,
      message: 'Guest cart successfully merged into customer account',
      cart: res.cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cart merge failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
