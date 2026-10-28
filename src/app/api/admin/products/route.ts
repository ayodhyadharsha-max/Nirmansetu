import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditEvent } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { SEED_PRODUCTS } from '@/lib/catalog/seed-data';
import { PublicCatalogItem } from '@/types/database';

// Memory cache for runtime product mutations in dev/offline
const memoryProducts: Map<string, PublicCatalogItem> = new Map(
  SEED_PRODUCTS.map((p) => [p.product_id, { ...p }])
);

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('q')?.toLowerCase();

    const supabase = createAdminClient();
    const { data: dbProducts, error } = await supabase
      .from('public_catalog_view')
      .select('*');

    let products: PublicCatalogItem[];

    if (error || !dbProducts || dbProducts.length === 0) {
      products = Array.from(memoryProducts.values());
    } else {
      products = dbProducts as PublicCatalogItem[];
    }

    if (category) {
      products = products.filter(
        (p) => p.category_slug === category || p.category_name.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (search) {
      products = products.filter(
        (p) =>
          p.product_title.toLowerCase().includes(search) ||
          (p.brand_name || '').toLowerCase().includes(search) ||
          p.category_name.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, products, count: products.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const {
      title,
      slug,
      brandName,
      categoryName,
      categorySlug,
      sellingPricePaise,
      mrpPaise,
      unit,
      minOrderQuantity,
      gstRatePct,
      imageUrl,
      isDeliverable,
    } = body;

    if (!title || !sellingPricePaise || !unit) {
      return NextResponse.json(
        { success: false, error: 'Product title, selling price (in paise), and unit are mandatory' },
        { status: 400 }
      );
    }

    const productId = `prod-${Date.now()}`;
    const productSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProduct: PublicCatalogItem = {
      product_id: productId,
      product_slug: productSlug,
      product_title: title,
      short_description: body.description || '',
      description: body.description || '',
      hsn_code: body.hsnCode || '6810',
      unit_of_measure: unit || 'Unit',
      is_bulk_available: true,
      is_featured: false,
      specifications: {},
      images: [imageUrl || '/images/products/placeholder.jpg'],
      tax_rate_pct: Number(gstRatePct) || 18,
      product_status: 'published',
      category_id: 'c0000000-0000-0000-0000-000000000001',
      category_name: categoryName || 'Construction Materials',
      category_slug: categorySlug || 'cement-construction-materials',
      brand_id: null,
      brand_name: brandName || 'Generic / Local Stockist',
      brand_slug: (brandName || 'generic').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand_logo: null,
      variant_id: `var-${Date.now()}`,
      variant_title: title,
      sku: `SKU-${Date.now().toString(36).toUpperCase()}`,
      pack_size: unit,
      attributes: {},
      min_order_qty: Number(minOrderQuantity) || 1,
      max_order_qty: body.maxOrderQuantity ? Number(body.maxOrderQuantity) : 500,
      weight_kg: 50,
      dimensions_cm: null,
      selling_price_paise: Number(sellingPricePaise),
      mrp_paise: mrpPaise ? Number(mrpPaise) : Number(sellingPricePaise),
      total_available_stock: 500,
      is_in_stock: isDeliverable !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in memory
    memoryProducts.set(productId, newProduct);

    // Attempt database insert if available
    try {
      const supabase = createAdminClient();
      await supabase.from('products').insert({
        id: productId,
        slug: productSlug,
        title,
        description: body.description || '',
        selling_price_paise: Number(sellingPricePaise),
        mrp_paise: mrpPaise ? Number(mrpPaise) : Number(sellingPricePaise),
        unit,
        is_active: true,
      });
    } catch {
      // Memory insert succeeded
    }

    await logAuditEvent({
      userId: admin.id,
      action: 'CREATE_PRODUCT',
      entityType: 'product',
      entityId: productId,
      newValues: { title, sellingPricePaise, unit },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create product';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const { productId, sellingPricePaise, mrpPaise, isDeliverable } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    const existing = memoryProducts.get(productId);
    if (existing) {
      if (sellingPricePaise !== undefined) existing.selling_price_paise = Number(sellingPricePaise);
      if (mrpPaise !== undefined) existing.mrp_paise = Number(mrpPaise);
      if (isDeliverable !== undefined) existing.is_in_stock = Boolean(isDeliverable);
      memoryProducts.set(productId, existing);
    }

    // Also update in Supabase if exists
    try {
      const supabase = createAdminClient();
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (sellingPricePaise !== undefined) updates.selling_price_paise = Number(sellingPricePaise);
      if (mrpPaise !== undefined) updates.mrp_paise = Number(mrpPaise);
      if (isDeliverable !== undefined) updates.is_active = Boolean(isDeliverable);

      await supabase.from('products').update(updates).eq('id', productId);
    } catch {
      // Memory updated
    }

    await logAuditEvent({
      userId: admin.id,
      action: 'UPDATE_PRODUCT',
      entityType: 'product',
      entityId: productId,
      newValues: { sellingPricePaise, mrpPaise, isDeliverable },
    });

    return NextResponse.json({ success: true, product: existing || { id: productId, ...body } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
