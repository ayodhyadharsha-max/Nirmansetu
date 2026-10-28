import { NextResponse } from 'next/server';
import { listProducts, createProductAdmin } from '@/lib/catalog/service';
import { searchCatalogProducts } from '@/config/homerun-catalog';
import { ProductCreateSchema } from '@/lib/validations/product';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const categorySlug = searchParams.get('category')?.trim() || undefined;
    const brandSlug = searchParams.get('brand')?.trim() || undefined;
    const search = searchParams.get('q')?.trim() || searchParams.get('search')?.trim() || undefined;
    const inStockOnly = searchParams.get('inStock') === 'true';
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;
    const sortBy = (searchParams.get('sort') as any) || 'featured';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 12;

    const result = await listProducts({
      categorySlug,
      brandSlug,
      search,
      inStockOnly,
      minPricePaise: minPrice,
      maxPricePaise: maxPrice,
      sortBy,
      page,
      limit,
    });

    if (result.items.length === 0 && search) {
      const fallbackMatches = searchCatalogProducts(search);
      if (fallbackMatches.length > 0) {
        result.items = fallbackMatches.slice((page - 1) * limit, page * limit).map((item) => ({
          product_id: item.id,
          product_title: item.title,
          product_slug: item.slug,
          short_description: item.title,
          description: item.title,
          hsn_code: '2523',
          unit_of_measure: 'units',
          is_bulk_available: true,
          is_featured: true,
          specifications: {},
          images: [item.imageUrl],
          tax_rate_pct: 18,
          product_status: 'published' as const,
          category_id: 'c0000000-0000-0000-0000-000000000001',
          category_name: 'Materials',
          category_slug: 'cement-construction-materials',
          brand_id: 'b0000000-0000-0000-0000-000000000001',
          brand_name: item.brand,
          brand_slug: item.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          brand_logo: item.imageUrl,
          variant_id: `v-${item.id}`,
          variant_title: 'Standard',
          sku: `SKU-${item.id}`,
          pack_size: 'Standard',
          attributes: {},
          min_order_qty: 1,
          max_order_qty: 500,
          weight_kg: 10,
          dimensions_cm: { length: 30, width: 20, height: 10 },
          selling_price_paise: item.price * 100,
          mrp_paise: item.mrp * 100,
          total_available_stock: 500,
          is_in_stock: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        result.totalCount = fallbackMatches.length;
        result.totalPages = Math.ceil(fallbackMatches.length / limit);
      }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorize: Check user session and admin role
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin permission from profiles table
    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      isAdmin = profile?.role === 'admin';
    }

    // Support administrative API secret header for CLI / backend automation scripts
    const adminApiSecret = request.headers.get('x-admin-key');
    const expectedSecret = process.env.ADMIN_API_KEY;
    if (adminApiSecret && expectedSecret && !expectedSecret.includes('placeholder') && adminApiSecret === expectedSecret) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator permissions are required to create catalogue products.' },
        { status: 403 }
      );
    }

    // 2. Validate input
    const json = await request.json();
    const result = ProductCreateSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const created = await createProductAdmin(result.data);
    return NextResponse.json(
      { success: true, message: 'Product created successfully', data: created },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Product creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
