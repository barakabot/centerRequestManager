import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/branches
export async function GET() {
  try {
    const branches = await db.branch.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { salesmen: true, targets: true, users: true } },
      },
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

// POST /api/admin/branches
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, region, isActive } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'نام و کد شعبه الزامی است' }, { status: 400 });
    }

    const existing = await db.branch.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'این کد شعبه قبلاً ثبت شده است' }, { status: 400 });
    }

    const branch = await db.branch.create({
      data: { name, code, region: region || null, isActive: isActive !== undefined ? isActive : true },
      include: { _count: { select: { salesmen: true, targets: true, users: true } } },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}

// PUT /api/admin/branches
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, region, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه شعبه الزامی است' }, { status: 400 });
    }

    if (code) {
      const existing = await db.branch.findFirst({ where: { code, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: 'این کد شعبه قبلاً ثبت شده است' }, { status: 400 });
      }
    }

    const branch = await db.branch.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(region !== undefined ? { region: region || null } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { _count: { select: { salesmen: true, targets: true, users: true } } },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

// DELETE /api/admin/branches
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه شعبه الزامی است' }, { status: 400 });
    }

    await db.branch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
