import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const branches = await db.branch.findMany({
      where: isActive !== null ? { isActive: isActive === 'true' } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { salesmen: true, targets: true } },
      },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}
