import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/product-groups
export async function GET() {
  try {
    const groups = await db.productGroup.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { targets: true, salesPerformance: true } },
      },
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching product groups:', error);
    return NextResponse.json({ error: 'Failed to fetch product groups' }, { status: 500 });
  }
}

// POST /api/admin/product-groups
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, salesLine, isActive } = body;

    if (!name || !code || !salesLine) {
      return NextResponse.json({ error: 'نام، کد و خط فروش الزامی است' }, { status: 400 });
    }

    const existing = await db.productGroup.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'این کد گروه کالایی قبلاً ثبت شده است' }, { status: 400 });
    }

    const group = await db.productGroup.create({
      data: { name, code, salesLine, isActive: isActive !== undefined ? isActive : true },
      include: { _count: { select: { targets: true, salesPerformance: true } } },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating product group:', error);
    return NextResponse.json({ error: 'Failed to create product group' }, { status: 500 });
  }
}

// PUT /api/admin/product-groups
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, salesLine, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه گروه کالایی الزامی است' }, { status: 400 });
    }

    if (code) {
      const existing = await db.productGroup.findFirst({ where: { code, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: 'این کد گروه کالایی قبلاً ثبت شده است' }, { status: 400 });
      }
    }

    const group = await db.productGroup.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(salesLine ? { salesLine } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { _count: { select: { targets: true, salesPerformance: true } } },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error updating product group:', error);
    return NextResponse.json({ error: 'Failed to update product group' }, { status: 500 });
  }
}

// DELETE /api/admin/product-groups
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه گروه کالایی الزامی است' }, { status: 400 });
    }

    await db.productGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product group:', error);
    return NextResponse.json({ error: 'Failed to delete product group' }, { status: 500 });
  }
}
