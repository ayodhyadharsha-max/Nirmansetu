import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCategories } from '@/lib/catalog/service';
import { SEED_CATEGORIES } from '@/lib/catalog/seed-data';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { name, slug, description, displayOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required.' }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        display_order: typeof displayOrder === 'number' ? displayOrder : 10,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // In-memory addition if database is offline
      const newCat = {
        id: `cat-${Date.now()}`,
        parent_id: null,
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        image_url: '/images/categories/cement.jpg',
        display_order: displayOrder || 10,
        default_gst_rate_pct: 18.0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      SEED_CATEGORIES.push(newCat);
      return NextResponse.json({ success: true, category: newCat });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { id, isActive, displayOrder } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof isActive === 'boolean') updates.is_active = isActive;
    if (typeof displayOrder === 'number') updates.display_order = displayOrder;

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const match = SEED_CATEGORIES.find((c) => c.id === id);
      if (match) {
        if (typeof isActive === 'boolean') match.is_active = isActive;
        if (typeof displayOrder === 'number') match.display_order = displayOrder;
        return NextResponse.json({ success: true, category: match });
      }
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
