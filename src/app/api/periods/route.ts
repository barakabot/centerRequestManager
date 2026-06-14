import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const periods = await db.period.findMany({
      where: status ? { status } : undefined,
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { targets: true } },
      },
    });

    return NextResponse.json(periods);
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
  }
}
