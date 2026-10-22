import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

require('dotenv').config();

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const permissions = [
  { name: 'VALIDATE_ORGANISATION', description: 'Valider une inscription d’association' },
  { name: 'PUBLISH_ORGANISATION', description: 'Rendre une association visible au public' },
  { name: 'UNPUBLISH_ORGANISATION', description: 'Retirer une association de la visibilité publique' },
  { name: 'LOG_SYSTEME', description: 'Consulter les journaux système' },
];

async function main() {
  const created = [];
  for (const permission of permissions) {
    created.push(
      await prisma.permission.upsert({
        where: { name: permission.name },
        create: permission,
        update: { description: permission.description },
      }),
    );
  }

  const roles = await prisma.role.findMany({
    where: { code: { in: ['ADMIN', 'GESTION'] } },
  });

  for (const role of roles) {
    const names = role.code === 'ADMIN'
      ? permissions.map((item) => item.name)
      : permissions.filter((item) => item.name !== 'LOG_SYSTEME').map((item) => item.name);
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: created.filter((item) => names.includes(item.name)).map((item) => ({ id: item.id })),
        },
      },
    });
  }

  await prisma.organisation.updateMany({
    where: { activated: true, validated: false },
    data: { validated: true },
  });

  console.log('Permissions organisation/journaux synchronisées.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
