import { NextResponse } from 'next/server';
import { importCatalogCsvAdmin } from '@/lib/catalog/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
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
        { error: 'Unauthorized: Admin permissions are required to import catalog data.' },
        { status: 403 }
      );
    }

    // Read CSV content from text or form-data
    let csvText = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form-data' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      csvText = await request.text();
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json({ error: 'Empty CSV content received' }, { status: 400 });
    }

    const result = await importCatalogCsvAdmin(csvText);

    return NextResponse.json({
      success: result.success,
      totalRows: result.totalRows,
      importedCount: result.importedCount,
      errors: result.errors,
      message: `Processed ${result.totalRows} rows. Successfully imported: ${result.importedCount}. Errors: ${result.errors.length}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CSV Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
