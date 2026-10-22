import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

require('dotenv').config();

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const ADMIN_PERMISSIONS = [
  'ACCESS_APP',
  'LOG',
  'LOG_SYSTEME',
  'DASHBORD_COMPTES',
  'DASHBORD_CONNEXIONS',
  'DASHBORD_EXPORT',
  'CREATE_USER',
  'READ_USER',
  'LIST_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'ACTIVATED_USER',
  'CREATE_PERMISSION',
  'READ_PERMISSION',
  'LIST_PERMISSION',
  'UPDATE_PERMISSION',
  'DELETE_PERMISSION',
  'CREATE_ROLE',
  'READ_ROLE',
  'LIST_ROLE',
  'UPDATE_ROLE',
  'DELETE_ROLE',
];

async function upsertPermission(name: string, description: string) {
  return prisma.permission.upsert({
    where: { name },
    create: { name, description },
    update: { description },
  });
}

async function main() {
  await upsertPermission('DASHBORD_COMPTES', 'Tableau de bord : comptes utilisateurs');
  await upsertPermission('DASHBORD_CONNEXIONS', 'Tableau de bord : connexions');
  await upsertPermission('DASHBORD_EXPORT', 'Exporter le tableau de bord');
  await upsertPermission('LOG_SYSTEME', 'Consulter les journaux système');

  const all = await prisma.permission.findMany();
  const byName = Object.fromEntries(all.map((item) => [item.name, item]));

  await prisma.role.update({
    where: { code: 'ADMIN' },
    data: {
      description: 'Administrateur de la plateforme',
      permissions: {
        set: ADMIN_PERMISSIONS.filter((name) => byName[name]).map((name) => ({ id: byName[name].id })),
      },
    },
  });

  console.log('Permissions du rôle Admin synchronisées.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
