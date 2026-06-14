import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const periodId = searchParams.get('periodId');
    const productGroupId = searchParams.get('productGroupId');
    const status = searchParams.get('status');

    const targets = await db.target.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(periodId ? { periodId } : {}),
        ...(productGroupId ? { productGroupId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        productGroup: true,
        branch: true,
        period: true,
        salesmanTargets: {
          include: {
            salesman: true,
          },
          orderBy: { salesman: { name: 'asc' } },
        },
      },
      orderBy: { productGroup: { name: 'asc' } },
    });

    return NextResponse.json(targets);
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { targetId, salesmanTargets } = body;

    if (!targetId || !salesmanTargets || !Array.isArray(salesmanTargets)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the target to validate
    const target = await db.target.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    // Validate salesman targets
    const errors: string[] = [];
    let totalAllocated = 0;

    for (const st of salesmanTargets) {
      if (st.assignedTarget < st.minTarget) {
        errors.push(`تارگت اختصاص‌یافته برای ${st.salesmanName} کمتر از کف تارگت (${st.minTarget}) است`);
      }
      totalAllocated += st.assignedTarget;
    }

    if (Math.abs(totalAllocated - target.totalTarget) > 1) {
      errors.push(`مجموع تارگت‌های فروشندگان (${totalAllocated}) با تارگت کل گروه کالا (${target.totalTarget}) برابر نیست`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Update salesman targets
    for (const st of salesmanTargets) {
      await db.salesmanTarget.update({
        where: { id: st.id },
        data: {
          assignedTarget: st.assignedTarget,
          stretchTarget: st.stretchTarget || null,
          status: 'confirmed',
        },
      });
    }

    // Update target allocated sum and status
    const newStatus = totalAllocated === target.totalTarget ? 'allocated' : 'partially_allocated';
    await db.target.update({
      where: { id: targetId },
      data: {
        allocatedTarget: totalAllocated,
        status: newStatus,
      },
    });

    return NextResponse.json({ success: true, message: 'تارگت‌ها با موفقیت ذخیره شدند' });
  } catch (error) {
    console.error('Error updating targets:', error);
    return NextResponse.json({ error: 'Failed to update targets' }, { status: 500 });
  }
}
