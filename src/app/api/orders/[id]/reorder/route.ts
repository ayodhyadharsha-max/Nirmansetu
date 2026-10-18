import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderDetails } from '@/lib/orders/service';
import { addItemToCart } from '@/lib/cart/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: { id: string };
}

const ReorderSchema = z.object({
  targetCartId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const orderId = params.id;
    const json = await request.json().catch(() => ({}));
    const parsed = ReorderSchema.safeParse(json);

    let userId = parsed.success ? parsed.data.userId : undefined;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Handled
    }

    const orderRes = await getOrderDetails(orderId, userId, false);
    if (!orderRes.success || !orderRes.order) {
      return NextResponse.json(
        { success: false, error: orderRes.error || 'Order not found' },
        { status: orderRes.status || 404 }
      );
    }

    const order = orderRes.order;
    const cartId = (parsed.success && parsed.data.targetCartId) || (userId ? `user-cart-${userId}` : `cart-${Date.now()}`);

    const addedItems = [];
    const skippedItems = [];

    for (const item of order.items) {
      const addRes = await addItemToCart({
        cartId,
        userId,
        variantId: item.variant_id,
        quantity: item.quantity,
        pincode: order.pincode,
      });

      if (addRes.success) {
        addedItems.push(item.product_title_snapshot);
      } else {
        skippedItems.push({ item: item.product_title_snapshot, reason: addRes.error });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${addedItems.length} items added to cart for reorder.`,
      addedCount: addedItems.length,
      skippedCount: skippedItems.length,
      skippedItems,
      cartId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reorder failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
