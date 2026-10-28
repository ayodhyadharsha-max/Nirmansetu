import { NextResponse } from 'next/server';
import { getProductBySlug, getProductById } from '@/lib/catalog/service';
import { ProductUpdateSchema } from '@/lib/validations/product';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    if (!slugOrId) {
      return NextResponse.json({ error: 'Product slug or ID is required' }, { status: 400 });
    }

    // Is it a UUID or a URL slug?
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const product = isUuid ? await getProductById(slugOrId) : await getProductBySlug(slugOrId);

    if (!product) {
      return NextResponse.json({ error: `Product not found for: ${slugOrId}` }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Product retrieval failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Check admin authorization
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      isAdmin = profile?.role === 'admin';
    }

    const adminApiSecret = request.headers.get('x-admin-key');
    const expectedSecret = process.env.ADMIN_API_KEY;
    if (adminApiSecret && expectedSecret && !expectedSecret.includes('placeholder') && adminApiSecret === expectedSecret) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin permissions are required to modify catalog products.' },
        { status: 403 }
      );
    }

    const slugOrId = params.slug;
    const json = await request.json();
    const result = ProductUpdateSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const updatePayload: Record<string, unknown> = {};

    if (result.data.title) updatePayload.title = result.data.title;
    if (result.data.description) updatePayload.description = result.data.description;
    if (result.data.shortDescription) updatePayload.short_description = result.data.shortDescription;
    if (result.data.hsnCode) updatePayload.hsn_code = result.data.hsnCode;
    if (result.data.unitOfMeasure) updatePayload.unit_of_measure = result.data.unitOfMeasure;
    if (result.data.taxRatePct !== undefined) updatePayload.tax_rate_pct = result.data.taxRatePct;
    if (result.data.publicationStatus) updatePayload.publication_status = result.data.publicationStatus;
    if (result.data.specifications) updatePayload.specifications = result.data.specifications;
    if (result.data.images) updatePayload.images = result.data.images;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const filterCol = isUuid ? 'id' : 'slug';

    const { data: updatedProduct, error: pError } = await adminClient
      .from('products')
      .update(updatePayload)
      .eq(filterCol, slugOrId)
      .select('id, slug, title, publication_status')
      .single();

    if (pError) {
      throw new Error(`Update failed: ${pError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Product update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      isAdmin = profile?.role === 'admin';
    }

    const adminApiSecret = request.headers.get('x-admin-key');
    const expectedSecret = process.env.ADMIN_API_KEY;
    if (adminApiSecret && expectedSecret && !expectedSecret.includes('placeholder') && adminApiSecret === expectedSecret) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin permissions are required to archive/delete products.' },
        { status: 403 }
      );
    }

    const slugOrId = params.slug;
    const adminClient = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const filterCol = isUuid ? 'id' : 'slug';

    // Soft delete / archive to maintain relational integrity with historical orders
    const { data, error } = await adminClient
      .from('products')
      .update({ publication_status: 'archived', is_active: false })
      .eq(filterCol, slugOrId)
      .select('id, slug, publication_status')
      .single();

    if (error) {
      throw new Error(`Deletion failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Product archived successfully',
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Product archive failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
