import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/catalog/service';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(
      { categories },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
