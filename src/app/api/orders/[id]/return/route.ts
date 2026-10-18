import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestOrderReturn } from '@/lib/orders/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: { id: string };
}

const ReturnSchema = z.object({
  returnReason: z.string().trim().min(5, 'Please select or provide a valid reason for return'),
  notes: z.string().trim().max(500).optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const orderId = params.id;
    const json = await request.json();
    const parsed = ReturnSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let userId = parsed.data.userId;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Handled
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to submit return request' },
        { status: 401 }
      );
    }

    const res = await requestOrderReturn(orderId, userId, parsed.data.returnReason, parsed.data.notes);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Return request submitted. Our Ayodhya site quality team will contact you within 4 business hours.',
      order: res.order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Return request failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
