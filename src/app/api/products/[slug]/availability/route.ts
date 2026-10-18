import { NextResponse } from 'next/server';
import { getProductBySlug, getProductById, checkProductAvailability } from '@/lib/catalog/service';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode')?.trim() || '224123';
    const variantId = searchParams.get('variantId')?.trim();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const product = isUuid ? await getProductById(slugOrId) : await getProductBySlug(slugOrId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const targetVariantId = variantId || product.variant_id;
    const availability = await checkProductAvailability({
      variantId: targetVariantId,
      pincode,
    });

    return NextResponse.json({
      productId: product.product_id,
      productSlug: product.product_slug,
      variantId: targetVariantId,
      ...availability,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Availability check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
