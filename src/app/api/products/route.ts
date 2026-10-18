import { NextResponse } from 'next/server';
import { listProducts, createProductAdmin } from '@/lib/catalog/service';
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
    const expectedSecret = process.env.ADMIN_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (adminApiSecret && expectedSecret && adminApiSecret === expectedSecret) {
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
