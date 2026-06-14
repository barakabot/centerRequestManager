import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/dashboard — System-wide overview
export async function GET() {
  try {
    const totalBranches = await db.branch.count({ where: { isActive: true } });
    const inactiveBranches = await db.branch.count({ where: { isActive: false } });
    const totalSalesmen = await db.salesman.count({ where: { isActive: true } });
    const totalProductGroups = await db.productGroup.count({ where: { isActive: true } });
    const activePeriod = await db.period.findFirst({ where: { status: 'active' } });

    let targetStats = {
      totalTargets: 0,
      pendingTargets: 0,
      partiallyAllocated: 0,
      allocatedTargets: 0,
      finalizedTargets: 0,
      totalTargetValue: 0,
      totalAllocatedValue: 0,
    };

    if (activePeriod) {
      const targets = await db.target.findMany({ where: { periodId: activePeriod.id } });
      targetStats = {
        totalTargets: targets.length,
        pendingTargets: targets.filter(t => t.status === 'pending').length,
        partiallyAllocated: targets.filter(t => t.status === 'partially_allocated').length,
        allocatedTargets: targets.filter(t => t.status === 'allocated').length,
        finalizedTargets: targets.filter(t => t.status === 'finalized').length,
        totalTargetValue: targets.reduce((sum, t) => sum + t.totalTarget, 0),
        totalAllocatedValue: targets.reduce((sum, t) => sum + t.allocatedTarget, 0),
      };
    }

    const totalRequests = await db.adHocRequest.count();
    const pendingRequests = await db.adHocRequest.count({ where: { status: 'pending' } });
    const approvedRequests = await db.adHocRequest.count({ where: { status: 'approved' } });
    const rejectedRequests = await db.adHocRequest.count({ where: { status: 'rejected' } });

    const totalUsers = await db.user.count();
    const adminUsers = await db.user.count({ where: { role: 'admin' } });
    const planningUsers = await db.user.count({ where: { role: 'planning' } });
    const branchManagerUsers = await db.user.count({ where: { role: 'branch_manager' } });

    const branchPerformance = await db.branch.findMany({
      where: { isActive: true },
      include: {
        targets: {
          where: activePeriod ? { periodId: activePeriod.id } : undefined,
          select: { totalTarget: true, allocatedTarget: true, status: true },
        },
        _count: { select: { salesmen: true } },
      },
      orderBy: { name: 'asc' },
    });

    const branchStats = branchPerformance.map(b => ({
      id: b.id,
      name: b.name,
      code: b.code,
      region: b.region,
      salesmenCount: b._count.salesmen,
      totalTarget: b.targets.reduce((sum, t) => sum + t.totalTarget, 0),
      totalAllocated: b.targets.reduce((sum, t) => sum + t.allocatedTarget, 0),
      targetCount: b.targets.length,
      finalizedCount: b.targets.filter(t => t.status === 'finalized' || t.status === 'allocated').length,
      allocationRate: b.targets.reduce((sum, t) => sum + t.totalTarget, 0) > 0
        ? Math.round((b.targets.reduce((sum, t) => sum + t.allocatedTarget, 0) / b.targets.reduce((sum, t) => sum + t.totalTarget, 0)) * 100)
        : 0,
    }));

    return NextResponse.json({
      overview: {
        totalBranches, inactiveBranches, totalSalesmen, totalProductGroups,
        totalUsers, adminUsers, planningUsers, branchManagerUsers,
        totalRequests, pendingRequests, approvedRequests, rejectedRequests,
        activePeriod, targetStats,
      },
      branchStats,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch admin dashboard' }, { status: 500 });
  }
}
