import { PrismaClient } from '@prisma/client';

// Define status inline since prisma/seed.ts runs outside Next.js path-alias resolution
const SubscriptionStatus = { INACTIVE: 'INACTIVE' } as const;

const prisma = new PrismaClient();

/**
 * Seeds the database with a test user and an INACTIVE subscription.
 * Run with: npx ts-node prisma/seed.ts
 */
async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      subscription: {
        create: {
          status: SubscriptionStatus.INACTIVE,
        },
      },
    },
  });

  console.log(`✅ Created test user: ${user.email} (id: ${user.id})`);
  console.log('   Subscription status: INACTIVE');
  console.log('🌱 Seeding complete.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
