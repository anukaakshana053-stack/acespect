// Seeds a reviewer account for the dashboard. Run once:
//   npx tsx scripts/seedReviewer.ts
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';

async function main() {
  const email = 'reviewer@acespect.app';
  const passwordHash = await hashPassword('Review123');
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'REVIEWER', isActive: true },
    create: { email, name: 'Rita Reviewer', passwordHash, role: 'REVIEWER' },
  });
  // eslint-disable-next-line no-console
  console.log(`✅ reviewer seeded: ${user.email} (${user.role})  password: Review123`);
  await prisma.$disconnect();
}

void main();
