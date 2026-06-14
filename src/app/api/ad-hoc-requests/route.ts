import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const requests = await db.adHocRequest.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        branch: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching ad-hoc requests:', error);
    return NextResponse.json({ error: 'Failed to fetch ad-hoc requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { branchId, type, title, description, priority, createdBy } = body;

    if (!branchId || !type || !title || !description || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = await db.adHocRequest.create({
      data: {
        branchId,
        type,
        title,
        description,
        priority: priority || 'normal',
        createdBy,
        status: 'pending',
      },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating ad-hoc request:', error);
    return NextResponse.json({ error: 'Failed to create ad-hoc request' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, reviewedBy, reviewNote } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await db.adHocRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedBy || null,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
      include: {
        branch: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating ad-hoc request:', error);
    return NextResponse.json({ error: 'Failed to update ad-hoc request' }, { status: 500 });
  }
}
