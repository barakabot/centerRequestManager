import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await db.salesPerformance.deleteMany();
  await db.salesmanTarget.deleteMany();
  await db.target.deleteMany();
  await db.adHocRequest.deleteMany();
  await db.salesman.deleteMany();
  await db.user.deleteMany();
  await db.period.deleteMany();
  await db.productGroup.deleteMany();
  await db.branch.deleteMany();

  // ========== Branches ==========
  const branchTehran = await db.branch.create({
    data: { name: 'شعبه تهران مرکزی', code: 'BR-THR-01', region: 'تهران', isActive: true },
  });
  const branchIsfahan = await db.branch.create({
    data: { name: 'شعبه اصفهان', code: 'BR-ISF-01', region: 'اصفهان', isActive: true },
  });
  const branchShiraz = await db.branch.create({
    data: { name: 'شعبه شیراز', code: 'BR-SHZ-01', region: 'فارس', isActive: true },
  });
  const branchMashhad = await db.branch.create({
    data: { name: 'شعبه مشهد', code: 'BR-MHD-01', region: 'خراسان رضوی', isActive: true },
  });
  const branchTabriz = await db.branch.create({
    data: { name: 'شعبه تبریز', code: 'BR-TBZ-01', region: 'آذربایجان شرقی', isActive: true },
  });

  console.log('✅ Branches created');

  // ========== Product Groups ==========
  const pgFood = await db.productGroup.create({
    data: { name: 'مواد غذایی', code: 'PG-FOOD', salesLine: 'خوراکی', isActive: true },
  });
  const pgBeverage = await db.productGroup.create({
    data: { name: 'نوشیدنی', code: 'PG-BEV', salesLine: 'خوراکی', isActive: true },
  });
  const pgDairy = await db.productGroup.create({
    data: { name: 'لبنیات', code: 'PG-DAIRY', salesLine: 'خوراکی', isActive: true },
  });
  const pgHygiene = await db.productGroup.create({
    data: { name: 'بهداشتی', code: 'PG-HYG', salesLine: 'بهداشتی', isActive: true },
  });
  const pgSnacks = await db.productGroup.create({
    data: { name: 'تنقلات', code: 'PG-SNK', salesLine: 'خوراکی', isActive: true },
  });
  const pgConfectionery = await db.productGroup.create({
    data: { name: 'شیرینی و شکلات', code: 'PG-CONF', salesLine: 'خوراکی', isActive: true },
  });

  console.log('✅ Product Groups created');

  // ========== Periods ==========
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const periodCurrent = await db.period.create({
    data: {
      name: 'دوره جاری',
      startDate: new Date(currentYear, currentMonth, 1),
      endDate: new Date(currentYear, currentMonth + 1, 0),
      deadlineDate: new Date(currentYear, currentMonth, 28, 23, 59, 59),
      status: 'active',
    },
  });

  const periodPrevious = await db.period.create({
    data: {
      name: 'دوره قبلی',
      startDate: new Date(currentYear, currentMonth - 1, 1),
      endDate: new Date(currentYear, currentMonth, 0),
      deadlineDate: new Date(currentYear, currentMonth - 1, 28, 23, 59, 59),
      status: 'closed',
    },
  });

  console.log('✅ Periods created');

  // ========== Salesmen ==========
  const salesmenData = [
    // Tehran
    { name: 'محمد احمدی', code: 'SM-THR-01', branchId: branchTehran.id },
    { name: 'علی رضایی', code: 'SM-THR-02', branchId: branchTehran.id },
    { name: 'حسین محمدی', code: 'SM-THR-03', branchId: branchTehran.id },
    { name: 'رضا کریمی', code: 'SM-THR-04', branchId: branchTehran.id },
    // Isfahan
    { name: 'مهدی موسوی', code: 'SM-ISF-01', branchId: branchIsfahan.id },
    { name: 'سعید جعفری', code: 'SM-ISF-02', branchId: branchIsfahan.id },
    { name: 'امیر حسینی', code: 'SM-ISF-03', branchId: branchIsfahan.id },
    // Shiraz
    { name: 'فرهاد شریفی', code: 'SM-SHZ-01', branchId: branchShiraz.id },
    { name: 'کامران نوری', code: 'SM-SHZ-02', branchId: branchShiraz.id },
    // Mashhad
    { name: 'بهروز صادقی', code: 'SM-MHD-01', branchId: branchMashhad.id },
    { name: 'داود رحیمی', code: 'SM-MHD-02', branchId: branchMashhad.id },
    { name: 'ناصر قاسمی', code: 'SM-MHD-03', branchId: branchMashhad.id },
    // Tabriz
    { name: 'یوسف اوغلی', code: 'SM-TBZ-01', branchId: branchTabriz.id },
    { name: 'عباس میرزایی', code: 'SM-TBZ-02', branchId: branchTabriz.id },
  ];

  const salesmen = [];
  for (const sm of salesmenData) {
    salesmen.push(await db.salesman.create({ data: sm }));
  }

  console.log('✅ Salesmen created');

  // ========== Users ==========
  await db.user.create({
    data: { name: 'مدیر سیستم', email: 'admin@target.sys', role: 'admin', branchId: null, isActive: true },
  });
  await db.user.create({
    data: { name: 'برنامه‌ریز فروش', email: 'planning@target.sys', role: 'planning', branchId: null, isActive: true },
  });
  await db.user.create({
    data: { name: 'مدیر شعبه تهران', email: 'tehran@target.sys', role: 'branch_manager', branchId: branchTehran.id, isActive: true },
  });
  await db.user.create({
    data: { name: 'مدیر شعبه اصفهان', email: 'isfahan@target.sys', role: 'branch_manager', branchId: branchIsfahan.id, isActive: true },
  });
  await db.user.create({
    data: { name: 'مدیر شعبه شیراز', email: 'shiraz@target.sys', role: 'branch_manager', branchId: branchShiraz.id, isActive: true },
  });
  await db.user.create({
    data: { name: 'مدیر شعبه مشهد', email: 'mashhad@target.sys', role: 'branch_manager', branchId: branchMashhad.id, isActive: true },
  });
  await db.user.create({
    data: { name: 'مدیر شعبه تبریز', email: 'tabriz@target.sys', role: 'branch_manager', branchId: branchTabriz.id, isActive: true },
  });

  console.log('✅ Users created');

  // ========== Targets & Salesman Targets ==========
  const allBranches = [branchTehran, branchIsfahan, branchShiraz, branchMashhad, branchTabriz];
  const allProductGroups = [pgFood, pgBeverage, pgDairy, pgHygiene, pgSnacks, pgConfectionery];
  const targetValues = [
    // Tehran - larger targets
    [12000, 8000, 9500, 6000, 7000, 5500],
    // Isfahan
    [9000, 6500, 7000, 4500, 5500, 4000],
    // Shiraz
    [7000, 5000, 5500, 3500, 4500, 3200],
    // Mashhad
    [8500, 6000, 6500, 4000, 5000, 3800],
    // Tabriz
    [6000, 4500, 5000, 3000, 4000, 2800],
  ];

  for (let bi = 0; bi < allBranches.length; bi++) {
    const branch = allBranches[bi];
    for (let pi = 0; pi < allProductGroups.length; pi++) {
      const pg = allProductGroups[pi];
      const totalTarget = targetValues[bi][pi];

      // Create target for current period
      const target = await db.target.create({
        data: {
          periodId: periodCurrent.id,
          productGroupId: pg.id,
          branchId: branch.id,
          totalTarget,
          allocatedTarget: Math.floor(totalTarget * 0.65), // 65% allocated on average
          status: 'partially_allocated',
        },
      });

      // Get salesmen for this branch
      const branchSalesmen = salesmen.filter(s => s.branchId === branch.id);
      if (branchSalesmen.length === 0) continue;

      const perSalesmanTarget = Math.floor(totalTarget / branchSalesmen.length);
      const minTarget = Math.floor(perSalesmanTarget * 0.6);

      for (const sm of branchSalesmen) {
        const variation = Math.floor(Math.random() * 2000) - 500;
        const suggested = perSalesmanTarget + variation;
        const assigned = Math.floor(suggested * (0.6 + Math.random() * 0.4));
        const avgCarton = Math.floor(50 + Math.random() * 200);
        const customers = Math.floor(15 + Math.random() * 60);

        await db.salesmanTarget.create({
          data: {
            targetId: target.id,
            salesmanId: sm.id,
            suggestedTarget: Math.max(suggested, minTarget),
            assignedTarget: Math.max(assigned, minTarget),
            stretchTarget: Math.floor(suggested * 1.2),
            minTarget,
            avgCartonSales: avgCarton,
            activeCustomers: customers,
            status: Math.random() > 0.5 ? 'confirmed' : 'pending',
          },
        });
      }

      // Create target for previous period (closed)
      const prevTarget = await db.target.create({
        data: {
          periodId: periodPrevious.id,
          productGroupId: pg.id,
          branchId: branch.id,
          totalTarget: Math.floor(totalTarget * 0.9),
          allocatedTarget: Math.floor(totalTarget * 0.88),
          status: 'finalized',
          finalizedAt: new Date(currentYear, currentMonth - 1, 26),
        },
      });

      // Previous period salesman targets (all confirmed)
      for (const sm of branchSalesmen) {
        const variation = Math.floor(Math.random() * 1500) - 400;
        const suggested = Math.floor((totalTarget * 0.9) / branchSalesmen.length) + variation;
        const assigned = Math.floor(suggested * (0.8 + Math.random() * 0.2));
        const min = Math.floor(suggested * 0.6);

        await db.salesmanTarget.create({
          data: {
            targetId: prevTarget.id,
            salesmanId: sm.id,
            suggestedTarget: Math.max(suggested, min),
            assignedTarget: Math.max(assigned, min),
            stretchTarget: Math.floor(suggested * 1.15),
            minTarget: min,
            avgCartonSales: Math.floor(40 + Math.random() * 180),
            activeCustomers: Math.floor(10 + Math.random() * 50),
            status: 'confirmed',
          },
        });
      }
    }
  }

  console.log('✅ Targets & Salesman Targets created');

  // ========== Sales Performance (previous period) ==========
  for (const sm of salesmen) {
    for (const pg of allProductGroups) {
      const actualSales = Math.floor(200 + Math.random() * 3000);
      const customerCount = Math.floor(5 + Math.random() * 40);

      await db.salesPerformance.create({
        data: {
          salesmanId: sm.id,
          productGroupId: pg.id,
          periodId: periodPrevious.id,
          actualSales,
          customerCount,
        },
      });
    }
  }

  console.log('✅ Sales Performance created');

  // ========== Ad-hoc Requests ==========
  const requestTypes = ['correction', 'additional', 'transfer', 'other'];
  const requestTitles = [
    'اصلاح تارگت گروه لبنیات',
    'درخواست افزایش تارگت نوشیدنی',
    'انتقال تارگت بین فروشندگان',
    'درخواست تارگت تکمیلی تنقلات',
    'اصلاح تارگت مواد غذایی - فروشنده جدید',
    'درخواست تارگت انگیزشی گروه بهداشتی',
    'بروزرسانی تعداد مشتریان فعال',
    'انتقال سهم فروشنده مرخصی‌رفته',
  ];
  const requestDescriptions = [
    'با توجه به تغییر شرایط بازار، خواهان اصلاح تارگت ماه جاری هستیم.',
    'به دلیل ورود مشتریان جدید، نیاز به افزایش تارگت داریم.',
    'فروشنده احمدی به مرخصی رفته و تارگت وی باید به فروشنده رضایی منتقل شود.',
    'درخواست تارگت تکمیلی برای پوشش مشتریان منطقه شمالی.',
    'فروشنده جدید به شعبه اضافه شده و نیاز به تعریف تارگت دارد.',
    'پیشنهاد تعریف تارگت انگیزشی برای فروشندگان برتر.',
    'تعداد مشتریان فعال نیاز به بروزرسانی دارد.',
    'فروشنده مرخصی‌رفته، تارگت وی باید توزیع شود.',
  ];
  const requestStatuses = ['pending', 'in_review', 'approved', 'rejected'];
  const priorities = ['low', 'normal', 'high', 'urgent'];

  for (let i = 0; i < 12; i++) {
    const branchIndex = Math.floor(Math.random() * allBranches.length);
    const status = requestStatuses[Math.floor(Math.random() * requestStatuses.length)];
    const daysAgo = Math.floor(Math.random() * 15);
    const createdDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    await db.adHocRequest.create({
      data: {
        branchId: allBranches[branchIndex].id,
        type: requestTypes[i % requestTypes.length],
        title: requestTitles[i % requestTitles.length],
        description: requestDescriptions[i % requestDescriptions.length],
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        createdBy: `مدیر شعبه ${allBranches[branchIndex].name.split(' ').slice(-1)}`,
        reviewedBy: status === 'approved' || status === 'rejected' ? 'برنامه‌ریز فروش' : null,
        reviewNote: status === 'approved' ? 'تأیید شد' : status === 'rejected' ? 'عدم تطابق با شرایط' : null,
        reviewedAt: status === 'approved' || status === 'rejected' ? new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        createdAt: createdDate,
      },
    });
  }

  console.log('✅ Ad-hoc Requests created');
  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
