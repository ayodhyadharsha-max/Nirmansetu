import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cancelOrder } from '@/lib/orders/service';
import { getAuthenticatedServerSession } from '@/lib/auth/roles';

interface Params {
  params: { id: string };
}

const CancelSchema = z.object({
  reason: z.string().trim().min(5, 'Please provide a reason for cancellation (at least 5 characters)'),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const orderId = params.id;
    const json = await request.json();
    const parsed = CancelSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await getAuthenticatedServerSession(request);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to cancel an order. Please log in.' },
        { status: 401 }
      );
    }

    const res = await cancelOrder(
      orderId,
      session.id,
      parsed.data.reason,
      session.role === 'admin'
    );

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order successfully cancelled.',
      order: res.order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cancellation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
