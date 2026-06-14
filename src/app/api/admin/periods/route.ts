import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/periods
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
    return NextResponse.json({ error: 'خطا در دریافت لیست دوره‌ها' }, { status: 500 });
  }
}

// POST /api/admin/periods
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, deadlineDate, status } = body;

    if (!name || !startDate || !endDate || !deadlineDate) {
      return NextResponse.json({ error: 'نام، تاریخ شروع، تاریخ پایان و مهلت الزامی است' }, { status: 400 });
    }

    const period = await db.period.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        deadlineDate: new Date(deadlineDate),
        status: status || 'active',
      },
      include: {
        _count: { select: { targets: true } },
      },
    });

    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    console.error('Error creating period:', error);
    return NextResponse.json({ error: 'خطا در ایجاد دوره' }, { status: 500 });
  }
}

// PUT /api/admin/periods
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, startDate, endDate, deadlineDate, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه دوره الزامی است' }, { status: 400 });
    }

    const period = await db.period.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(deadlineDate ? { deadlineDate: new Date(deadlineDate) } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        _count: { select: { targets: true } },
      },
    });

    return NextResponse.json(period);
  } catch (error) {
    console.error('Error updating period:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی دوره' }, { status: 500 });
  }
}

// DELETE /api/admin/periods
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه دوره الزامی است' }, { status: 400 });
    }

    await db.period.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting period:', error);
    return NextResponse.json({ error: 'خطا در حذف دوره' }, { status: 500 });
  }
}
