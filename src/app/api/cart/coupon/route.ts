import { NextResponse } from 'next/server';
import { z } from 'zod';
import { applyCouponToCart, removeCouponFromCart } from '@/lib/cart/service';

const ApplyCouponSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  couponCode: z.string().trim().min(1, 'Coupon code cannot be empty').max(50),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ApplyCouponSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cartId, couponCode } = parsed.data;
    const res = await applyCouponToCart(cartId, couponCode);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to apply coupon', cart: res.cart },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Coupon "${couponCode.toUpperCase()}" applied successfully!`,
      cart: res.cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Coupon application failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');

    if (!cartId) {
      return NextResponse.json({ success: false, error: 'cartId query parameter is required' }, { status: 400 });
    }

    const res = await removeCouponFromCart(cartId);

    return NextResponse.json({
      success: true,
      message: 'Coupon removed from cart',
      cart: res.cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Coupon removal failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
