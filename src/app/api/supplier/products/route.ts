import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listSupplierProducts, upsertSupplierProduct } from '@/lib/suppliers/service';
import { requireSupplier } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    const session = await requireSupplier(request);
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId') || session.supplierId;

    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const products = await listSupplierProducts(supplierId, session);
    return NextResponse.json({
      success: true,
      supplierId,
      products,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const UpsertSupplierProductSchema = z.object({
  supplierId: z.string().optional(),
  variantId: z.string().min(1, 'Variant ID is required'),
  supplierCostPaise: z.number().int().positive('Wholesale cost must be a positive integer in paise'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  isAvailable: z.boolean().default(true),
  leadTimeHours: z.number().int().min(1).max(168).optional().default(2),
  supplierSku: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSupplier(request);
    const json = await request.json();
    const parsed = UpsertSupplierProductSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supplierId = parsed.data.supplierId || session.supplierId;
    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const result = await upsertSupplierProduct(supplierId, session, {
      variantId: parsed.data.variantId,
      supplierCostPaise: parsed.data.supplierCostPaise,
      stockQuantity: parsed.data.stockQuantity,
      isAvailable: parsed.data.isAvailable,
      leadTimeHours: parsed.data.leadTimeHours,
      supplierSku: parsed.data.supplierSku,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product stock and wholesale pricing updated',
      product: result.product,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
