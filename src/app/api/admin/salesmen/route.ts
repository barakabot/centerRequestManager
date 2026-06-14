import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/salesmen
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
    return NextResponse.json({ error: 'خطا در دریافت لیست فروشندگان' }, { status: 500 });
  }
}

// POST /api/admin/salesmen
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, branchId, isActive } = body;

    if (!name || !code || !branchId) {
      return NextResponse.json({ error: 'نام، کد و شعبه الزامی است' }, { status: 400 });
    }

    // Check duplicate code
    const existing = await db.salesman.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'این کد فروشنده قبلاً ثبت شده است' }, { status: 400 });
    }

    // Verify branch exists
    const branch = await db.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json({ error: 'شعبه مورد نظر یافت نشد' }, { status: 400 });
    }

    const salesman = await db.salesman.create({
      data: {
        name,
        code,
        branchId,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(salesman, { status: 201 });
  } catch (error) {
    console.error('Error creating salesman:', error);
    return NextResponse.json({ error: 'خطا در ایجاد فروشنده' }, { status: 500 });
  }
}

// PUT /api/admin/salesmen
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, branchId, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه فروشنده الزامی است' }, { status: 400 });
    }

    // Check duplicate code (excluding current salesman)
    if (code) {
      const existing = await db.salesman.findFirst({ where: { code, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: 'این کد فروشنده قبلاً ثبت شده است' }, { status: 400 });
      }
    }

    // Verify branch exists if provided
    if (branchId) {
      const branch = await db.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        return NextResponse.json({ error: 'شعبه مورد نظر یافت نشد' }, { status: 400 });
      }
    }

    const salesman = await db.salesman.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(branchId ? { branchId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(salesman);
  } catch (error) {
    console.error('Error updating salesman:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی فروشنده' }, { status: 500 });
  }
}

// DELETE /api/admin/salesmen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه فروشنده الزامی است' }, { status: 400 });
    }

    await db.salesman.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting salesman:', error);
    return NextResponse.json({ error: 'خطا در حذف فروشنده' }, { status: 500 });
  }
}
