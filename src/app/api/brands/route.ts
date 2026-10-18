import { NextResponse } from 'next/server';
import { getBrands } from '@/lib/catalog/service';

export async function GET() {
  try {
    const brands = await getBrands();
    return NextResponse.json({ brands });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch brands';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
