import { prisma } from '../lib/prisma.js'

async function migrateToCredits() {
  console.log('🚀 Starting migration to credit system...')

  try {
    // Get current month start for consistent timing
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // 1. Migrate 'free' plan users to 'standard' with monthly credits
    const freeUsers = await prisma.entitlement.updateMany({
      where: { plan: 'free' },
      data: {
        plan: 'standard',
        creditBalance: 0, // Start with 0 purchased credits
        freeCreditsThisMonth: 6, // Give them 6 free credits this month
        lastMonthlyReset: monthStart
      }
    })
    console.log(`✅ Migrated ${freeUsers.count} free users to standard plan with 6 free monthly credits`)

    // 2. Migrate 'day_pass' users to 'standard' with compensation credits
    const dayPassUsers = await prisma.entitlement.updateMany({
      where: { plan: 'day_pass' },
      data: {
        plan: 'standard',
        creditBalance: 12, // Give them 12 purchased credits as compensation for day pass
        freeCreditsThisMonth: 6, // Plus 6 free credits this month
        lastMonthlyReset: monthStart,
        expiresAt: null // Remove expiry since they're now standard users
      }
    })
    console.log(`✅ Migrated ${dayPassUsers.count} day_pass users to standard plan with 12 purchased + 6 free credits`)

    // 3. Ensure all pro users have unlimited credits (set creditBalance to -1 as indicator)
    const proUsers = await prisma.entitlement.updateMany({
      where: { plan: { in: ['pro_monthly', 'pro_annual'] } },
      data: {
        creditBalance: -1 // -1 indicates unlimited
      }
    })
    console.log(`✅ Updated ${proUsers.count} pro users with unlimited credit indicator`)

    // 4. Log final statistics
    const stats = await prisma.entitlement.groupBy({
      by: ['plan'],
      _count: { plan: true }
    })

    console.log('\n📊 Final user distribution:')
    stats.forEach(stat => {
      console.log(`   ${stat.plan}: ${stat._count.plan} users`)
    })

    console.log('\n🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateToCredits().catch(console.error)