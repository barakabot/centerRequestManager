import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const periodId = searchParams.get('periodId');

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    const currentPeriodId = periodId || (await db.period.findFirst({ where: { status: 'active' } }))?.id;

    if (!currentPeriodId) {
      return NextResponse.json({ error: 'No active period found' }, { status: 404 });
    }

    // Get targets for this branch and period
    const targets = await db.target.findMany({
      where: {
        branchId,
        periodId: currentPeriodId,
      },
      include: {
        productGroup: true,
        salesmanTargets: {
          include: {
            salesman: true,
          },
        },
      },
    });

    // Get previous period for comparison
    const previousPeriod = await db.period.findFirst({
      where: { status: 'closed' },
      orderBy: { endDate: 'desc' },
    });

    let previousTargets: typeof targets = [];
    if (previousPeriod) {
      previousTargets = await db.target.findMany({
        where: {
          branchId,
          periodId: previousPeriod.id,
        },
        include: {
          productGroup: true,
          salesmanTargets: {
            include: {
              salesman: true,
            },
          },
        },
      });
    }

    // Calculate KPIs
    const totalTarget = targets.reduce((sum, t) => sum + t.totalTarget, 0);
    const totalAllocated = targets.reduce((sum, t) => sum + t.allocatedTarget, 0);
    const allocationRate = totalTarget > 0 ? (totalAllocated / totalTarget) * 100 : 0;
    const confirmedTargets = targets.filter(t => t.status === 'allocated' || t.status === 'finalized').length;
    const totalTargets = targets.length;

    // Get salesmen count for this branch
    const salesmenCount = await db.salesman.count({
      where: { branchId, isActive: true },
    });

    // Get ad-hoc requests count
    const pendingRequests = await db.adHocRequest.count({
      where: { branchId, status: 'pending' },
    });

    // Sales performance for previous period
    const previousActualSales = await db.salesPerformance.findMany({
      where: {
        salesman: { branchId },
        periodId: previousPeriod?.id,
      },
    });
    const totalActualSales = previousActualSales.reduce((sum, sp) => sum + sp.actualSales, 0);
    const totalPreviousTarget = previousTargets.reduce((sum, t) => sum + t.totalTarget, 0);
    const achievementRate = totalPreviousTarget > 0 ? (totalActualSales / totalPreviousTarget) * 100 : 0;

    // Get branch info
    const branch = await db.branch.findUnique({
      where: { id: branchId },
    });

    // Product group breakdown with chart data
    const productGroupBreakdown = targets.map(t => ({
      id: t.productGroup.id,
      name: t.productGroup.name,
      salesLine: t.productGroup.salesLine,
      totalTarget: t.totalTarget,
      allocatedTarget: t.allocatedTarget,
      allocationRate: t.totalTarget > 0 ? (t.allocatedTarget / t.totalTarget) * 100 : 0,
      status: t.status,
      salesmanCount: t.salesmanTargets.length,
      confirmedCount: t.salesmanTargets.filter(st => st.status === 'confirmed').length,
    }));

    // Sales by sales line
    const salesLineData = targets.reduce((acc, t) => {
      const line = t.productGroup.salesLine;
      if (!acc[line]) {
        acc[line] = { salesLine: line, totalTarget: 0, allocatedTarget: 0 };
      }
      acc[line].totalTarget += t.totalTarget;
      acc[line].allocatedTarget += t.allocatedTarget;
      return acc;
    }, {} as Record<string, { salesLine: string; totalTarget: number; allocatedTarget: number }>);

    return NextResponse.json({
      branch,
      period: await db.period.findUnique({ where: { id: currentPeriodId } }),
      kpis: {
        totalTarget,
        totalAllocated,
        allocationRate: Math.round(allocationRate * 10) / 10,
        confirmedTargets,
        totalTargets,
        salesmenCount,
        pendingRequests,
        totalActualSales,
        achievementRate: Math.round(achievementRate * 10) / 10,
      },
      productGroupBreakdown,
      salesLineData: Object.values(salesLineData),
      targets,
      previousTargets,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
