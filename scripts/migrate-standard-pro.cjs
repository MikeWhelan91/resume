/*
  One-off migration: free/day_pass -> standard; seed monthly credits.
  Usage:
    NODE_ENV=production node scripts/migrate-standard-pro.cjs
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  console.log('Starting migration to Standard/Pro credit model...');

  // 1) free -> standard
  const freeUsers = await prisma.entitlement.updateMany({
    where: { plan: 'free' },
    data: {
      plan: 'standard',
      creditBalance: 0,
      freeCreditsThisMonth: 6,
      lastMonthlyReset: monthStart,
    },
  });
  console.log(`Updated ${freeUsers.count} free users -> standard (6 monthly free)`);

  // 2) day_pass -> standard (compensate with purchased credits)
  const dayPassUsers = await prisma.entitlement.updateMany({
    where: { plan: 'day_pass' },
    data: {
      plan: 'standard',
      creditBalance: 12,
      freeCreditsThisMonth: 6,
      lastMonthlyReset: monthStart,
      expiresAt: null,
    },
  });
  console.log(`Updated ${dayPassUsers.count} day_pass users -> standard (12 purchased + 6 monthly free)`);

  // 3) Optional: ensure Pro plans are intact (no change needed)
  const proUsers = await prisma.entitlement.count({
    where: { plan: { in: ['pro_monthly', 'pro_annual'] } },
  });
  console.log(`Detected ${proUsers} Pro users (unchanged)`);

  // 4) Summary
  const stats = await prisma.entitlement.groupBy({ by: ['plan'], _count: { plan: true } });
  console.log('\nPlan distribution after migration:');
  for (const s of stats) console.log(`  ${s.plan}: ${s._count.plan}`);

  console.log('\nMigration completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

