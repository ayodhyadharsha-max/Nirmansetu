import { NextResponse } from 'next/server';
import { requireAdmin, logAuditEvent } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBrands, invalidateCatalogCache } from '@/lib/catalog/service';
import { SEED_BRANDS } from '@/lib/catalog/seed-data';

// In-memory brand overrides for development / fallback
const memoryAdminBrands = new Map<string, any>(SEED_BRANDS.map((b) => [b.id, { ...b }]));

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    const brands = await getBrands();

    // Merge in-memory brands if any
    const allBrands = [...brands];
    for (const mb of Array.from(memoryAdminBrands.values())) {
      if (!allBrands.some((b) => b.id === mb.id || b.slug === mb.slug)) {
        allBrands.push(mb);
      }
    }

    return NextResponse.json({
      success: true,
      brands: allBrands,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    const body = await request.json();
    const { name, slug, description, originCountry = 'India', logoUrl } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Brand name is required.' }, { status: 400 });
    }

    const brandSlug = (slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brandId = `b-${Date.now()}`;

    const newBrand = {
      id: brandId,
      name: name.trim(),
      slug: brandSlug,
      description: description?.trim() || null,
      origin_country: originCountry,
      logo_url: logoUrl?.trim() || '/images/brands/generic.png',
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from('brands').insert({
        name: newBrand.name,
        slug: newBrand.slug,
        description: newBrand.description,
        origin_country: newBrand.origin_country,
        logo_url: newBrand.logo_url,
        is_active: true,
      });
    } catch {
      // Database write failed, retain in memory
    }

    memoryAdminBrands.set(brandId, newBrand);
    invalidateCatalogCache();

    logAuditEvent({
      userId: session.id,
      action: 'brand.create',
      entityType: 'brand',
      entityId: brandId,
      newValues: { name: newBrand.name, slug: newBrand.slug },
    });

    return NextResponse.json({
      success: true,
      brand: newBrand,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin(request);
    const body = await request.json();
    const { brandId, isActive } = body;

    if (!brandId || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'brandId and boolean isActive are required.' }, { status: 400 });
    }

    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from('brands').update({ is_active: isActive }).eq('id', brandId);
    } catch {
      // Fallback
    }

    const existing = memoryAdminBrands.get(brandId);
    if (existing) {
      existing.is_active = isActive;
      existing.updated_at = new Date().toISOString();
    }

    invalidateCatalogCache();

    logAuditEvent({
      userId: session.id,
      action: 'brand.toggle_status',
      entityType: 'brand',
      entityId: brandId,
      newValues: { is_active: isActive },
    });

    return NextResponse.json({
      success: true,
      brandId,
      isActive,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
