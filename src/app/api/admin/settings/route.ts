import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/settings
export async function GET() {
  try {
    const settings = await db.settings.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

// POST /api/admin/settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, label } = body;

    if (!key || !value || !label) {
      return NextResponse.json({ error: 'کلید، مقدار و برچسب الزامی است' }, { status: 400 });
    }

    // Check duplicate key
    const existing = await db.settings.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: 'این کلید تنظیمات قبلاً ثبت شده است' }, { status: 400 });
    }

    const setting = await db.settings.create({
      data: { key, value, label },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'خطا در ایجاد تنظیمات' }, { status: 500 });
  }
}

// PUT /api/admin/settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'کلید و مقدار الزامی است' }, { status: 400 });
    }

    // Check if setting exists
    const existing = await db.settings.findUnique({ where: { key } });
    if (!existing) {
      return NextResponse.json({ error: 'تنظیمات مورد نظر یافت نشد' }, { status: 404 });
    }

    const setting = await db.settings.update({
      where: { key },
      data: { value },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی تنظیمات' }, { status: 500 });
  }
}
