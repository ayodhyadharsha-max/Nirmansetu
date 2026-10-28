import { NextResponse } from 'next/server';
import { getBrands } from '@/lib/catalog/service';

export async function GET() {
  try {
    const brands = await getBrands();
    return NextResponse.json(
      { brands },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch brands';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
