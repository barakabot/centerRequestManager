import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const salesLine = searchParams.get('salesLine');

    const productGroups = await db.productGroup.findMany({
      where: {
        ...(isActive !== null ? { isActive: isActive === 'true' } : {}),
        ...(salesLine ? { salesLine } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(productGroups);
  } catch (error) {
    console.error('Error fetching product groups:', error);
    return NextResponse.json({ error: 'Failed to fetch product groups' }, { status: 500 });
  }
}
