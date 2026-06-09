import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');

    const salesmen = await db.salesman.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(isActive !== null ? { isActive: isActive === 'true' } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(salesmen);
  } catch (error) {
    console.error('Error fetching salesmen:', error);
    return NextResponse.json({ error: 'Failed to fetch salesmen' }, { status: 500 });
  }
}
