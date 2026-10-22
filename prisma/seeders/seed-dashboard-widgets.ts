import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

require('dotenv').config();

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const WIDGETS = [
  { name: 'DASHBORD_STATS_ASSOCIATIONS', description: 'Tableau de bord : indicateurs associations' },
  { name: 'DASHBORD_STATS_EFFECTIFS', description: 'Tableau de bord : effectifs' },
  { name: 'DASHBORD_STATS_FINANCEMENT', description: 'Tableau de bord : financement' },
  { name: 'DASHBORD_GRAPHE_STATUT', description: 'Tableau de bord : graphe des statuts' },
  { name: 'DASHBORD_GRAPHE_TYPE', description: 'Tableau de bord : graphe des types' },
  { name: 'DASHBORD_GRAPHE_SEXE', description: 'Tableau de bord : graphe par sexe' },
  { name: 'DASHBORD_GRAPHE_PUBLIC', description: 'Tableau de bord : graphe public cible' },
  { name: 'DASHBORD_CARTES_PROVINCES', description: 'Tableau de bord : ballonnets par province' },
  { name: 'DASHBORD_EVOLUTION', description: 'Tableau de bord : évolution des dossiers' },
  { name: 'DASHBORD_AIDE_DECISION', description: 'Tableau de bord : aide à la décision' },
  { name: 'DASHBORD_COMPTES', description: 'Tableau de bord : comptes utilisateurs' },
  { name: 'DASHBORD_CONNEXIONS', description: 'Tableau de bord : connexions' },
  { name: 'DASHBORD_EXPORT', description: 'Exporter le tableau de bord' },
];

const ROLE_WIDGETS: Record<string, string[]> = {
  ADMIN: ['DASHBORD_COMPTES', 'DASHBORD_CONNEXIONS', 'DASHBORD_EXPORT'],
  INSTRUCTEUR: ['DASHBORD_STATS_ASSOCIATIONS', 'DASHBORD_GRAPHE_STATUT', 'DASHBORD_EVOLUTION', 'DASHBORD_EXPORT'],
  GESTION: ['DASHBORD_STATS_ASSOCIATIONS', 'DASHBORD_GRAPHE_STATUT', 'DASHBORD_EVOLUTION', 'DASHBORD_EXPORT'],
  VALIDATEUR: [
    'DASHBORD_STATS_ASSOCIATIONS',
    'DASHBORD_STATS_EFFECTIFS',
    'DASHBORD_STATS_FINANCEMENT',
    'DASHBORD_GRAPHE_STATUT',
    'DASHBORD_GRAPHE_TYPE',
    'DASHBORD_EVOLUTION',
    'DASHBORD_AIDE_DECISION',
    'DASHBORD_EXPORT',
  ],
  DIRECTEUR: [
    'DASHBORD_STATS_ASSOCIATIONS',
    'DASHBORD_STATS_FINANCEMENT',
    'DASHBORD_GRAPHE_STATUT',
    'DASHBORD_CARTES_PROVINCES',
    'DASHBORD_AIDE_DECISION',
    'DASHBORD_EXPORT',
  ],
};

async function main() {
  for (const widget of WIDGETS) {
    await prisma.permission.upsert({
      where: { name: widget.name },
      create: widget,
      update: { description: widget.description },
    });
  }

  const permissions = await prisma.permission.findMany();
  const byName = Object.fromEntries(permissions.map((item) => [item.name, item]));

  for (const [code, names] of Object.entries(ROLE_WIDGETS)) {
    const role = await prisma.role.findUnique({ where: { code }, include: { permissions: true } });
    if (!role) {
      continue;
    }
    const extra = names.filter((name) => byName[name]).map((name) => ({ id: byName[name].id }));
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { connect: extra } },
    });
  }

  console.log('Permissions de blocs du tableau de bord synchronisées.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
