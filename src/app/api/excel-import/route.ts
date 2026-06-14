import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('importType') as string; // targets, salesmen, performance

    if (!file) {
      return NextResponse.json({ error: 'فایل الزامی است' }, { status: 400 });
    }

    if (!importType) {
      return NextResponse.json({ error: 'نوع ورود اطلاعات الزامی است' }, { status: 400 });
    }

    // Read file content as text
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);

    // Parse CSV (simple CSV parser - handles most common cases)
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'فایل خالی است یا حداقل یک ردیف داده ندارد' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    // Validate based on import type
    const errors: { row: number; message: string }[] = [];
    const validRows: Record<string, string>[] = [];

    const requiredFields: Record<string, string[]> = {
      targets: ['branchCode', 'productGroupCode', 'totalTarget', 'periodName'],
      salesmen: ['name', 'code', 'branchCode'],
      performance: ['salesmanCode', 'productGroupCode', 'actualSales', 'customerCount'],
    };

    const required = requiredFields[importType] || [];
    const headerIndices: Record<string, number> = {};
    
    for (const field of required) {
      const idx = headers.findIndex(h => 
        h.toLowerCase().replace(/\s+/g, '') === field.toLowerCase().replace(/\s+/g, '') ||
        h.includes(field)
      );
      if (idx === -1) {
        errors.push({ row: 0, message: `ستون "${field}" در فایل یافت نشد` });
      } else {
        headerIndices[field] = idx;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'خطا در ساختار فایل', details: errors }, { status: 400 });
    }

    // Validate each row
    rows.forEach((row, index) => {
      const rowData: Record<string, string> = {};
      let rowValid = true;

      for (const [field, idx] of Object.entries(headerIndices)) {
        const value = row[idx]?.replace(/^"|"$/g, '') || '';
        rowData[field] = value;

        if (required.includes(field) && !value) {
          errors.push({ row: index + 2, message: `ردیف ${index + 2}: ستون "${field}" خالی است` });
          rowValid = false;
        }
      }

      // Type-specific validations
      if (importType === 'targets' && rowData.totalTarget) {
        const num = parseFloat(rowData.totalTarget);
        if (isNaN(num) || num <= 0) {
          errors.push({ row: index + 2, message: `ردیف ${index + 2}: تارگت کل باید عدد مثبت باشد` });
          rowValid = false;
        }
      }

      if (importType === 'performance' && rowData.actualSales) {
        const num = parseFloat(rowData.actualSales);
        if (isNaN(num) || num < 0) {
          errors.push({ row: index + 2, message: `ردیف ${index + 2}: فروش واقعی باید عدد غیرمنفی باشد` });
          rowValid = false;
        }
      }

      if (rowValid) {
        validRows.push(rowData);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'خطای اعتبارسنجی',
        details: errors,
        validRows: validRows.length,
        totalRows: rows.length,
      }, { status: 400 });
    }

    // If all valid, return the parsed data for confirmation
    return NextResponse.json({
      success: true,
      message: `${validRows.length} ردیف با موفقیت اعتبارسنجی شد`,
      totalRows: rows.length,
      validRows: validRows.length,
      headers,
      data: validRows.slice(0, 50), // Preview first 50 rows
      importType,
    });
  } catch (error) {
    console.error('Error importing Excel:', error);
    return NextResponse.json({ error: 'Failed to import file' }, { status: 500 });
  }
}
