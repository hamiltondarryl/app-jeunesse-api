import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedReferentiels } from './referentiels';

require('dotenv').config({ quiet: true });

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await seedReferentiels(prisma);
}

main()
  .catch(() => process.exit(1))
  .finally(async () => {
    await prisma.$disconnect();
  });
