import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/audit-logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const userId = searchParams.get('userId');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '50', 10);

    const where = {
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
      ...(userId ? { userId } : {}),
    };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(take, 100), // Cap at 100 results per page
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, skip, take });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'خطا در دریافت لاگ‌های حسابرسی' }, { status: 500 });
  }
}
