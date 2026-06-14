import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET /api/admin/users
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست کاربران' }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, branchId, isActive, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'نام، ایمیل و نقش الزامی است' }, { status: 400 });
    }

    // Check duplicate email
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }

    // Hash password - default to "123456" if not provided
    const hashedPassword = await hashPassword(password || '123456');

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        branchId: branchId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    // Create audit log
    const adminUserId = request.headers.get('x-user-id') || '';
    await createAuditLog({
      userId: adminUserId,
      action: 'create',
      entity: 'user',
      entityId: user.id,
      details: JSON.stringify({ name, email, role, branchId }),
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'خطا در ایجاد کاربر' }, { status: 500 });
  }
}

// PUT /api/admin/users
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role, branchId, isActive, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    // Check duplicate email (excluding current user)
    if (email) {
      const existing = await db.user.findFirst({ where: { email, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(role ? { role } : {}),
      ...(branchId !== undefined ? { branchId: branchId || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    // Hash and update password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    // Create audit log
    const adminUserId = request.headers.get('x-user-id') || '';
    await createAuditLog({
      userId: adminUserId,
      action: 'update',
      entity: 'user',
      entityId: id,
      details: JSON.stringify({ name, email, role, branchId, isActive, passwordChanged: !!password }),
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی کاربر' }, { status: 500 });
  }
}

// DELETE /api/admin/users
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    await db.user.delete({ where: { id } });

    // Create audit log
    const adminUserId = request.headers.get('x-user-id') || '';
    await createAuditLog({
      userId: adminUserId,
      action: 'delete',
      entity: 'user',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'خطا در حذف کاربر' }, { status: 500 });
  }
}
