import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/admin/targets-bulk — Bulk create targets for all branches for a given period/product group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { periodId, productGroupId, targets } = body as {
      periodId: string;
      productGroupId: string;
      targets: { branchId: string; totalTarget: number }[];
    };

    if (!periodId || !productGroupId || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const created = [];
    const updated = [];

    for (const t of targets) {
      if (!t.branchId || !t.totalTarget || t.totalTarget <= 0) continue;

      // Check if target already exists
      const existing = await db.target.findFirst({
        where: {
          periodId,
          productGroupId,
          branchId: t.branchId,
        },
      });

      if (existing) {
        // Update existing target
        const result = await db.target.update({
          where: { id: existing.id },
          data: { totalTarget: t.totalTarget },
        });
        updated.push(result);
      } else {
        // Create new target
        const result = await db.target.create({
          data: {
            periodId,
            productGroupId,
            branchId: t.branchId,
            totalTarget: t.totalTarget,
            allocatedTarget: 0,
            status: 'pending',
          },
        });

        // Get salesmen for this branch and create salesman targets
        const salesmen = await db.salesman.findMany({
          where: { branchId: t.branchId, isActive: true },
        });

        if (salesmen.length > 0) {
          const perSalesman = Math.floor(t.totalTarget / salesmen.length);
          const minTarget = Math.floor(perSalesman * 0.6);

          for (const sm of salesmen) {
            await db.salesmanTarget.create({
              data: {
                targetId: result.id,
                salesmanId: sm.id,
                suggestedTarget: perSalesman,
                assignedTarget: 0,
                stretchTarget: Math.floor(perSalesman * 1.2),
                minTarget,
                avgCartonSales: 0,
                activeCustomers: 0,
                status: 'pending',
              },
            });
          }
        }

        created.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} تارگت جدید ایجاد و ${updated.length} تارگت بروزرسانی شد`,
      created: created.length,
      updated: updated.length,
    });
  } catch (error) {
    console.error('Error bulk creating targets:', error);
    return NextResponse.json({ error: 'Failed to bulk create targets' }, { status: 500 });
  }
}
