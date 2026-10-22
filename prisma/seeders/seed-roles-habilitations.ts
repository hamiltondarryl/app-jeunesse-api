import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

require('dotenv').config();

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const DASHBORD_ADMIN = ['DASHBORD_COMPTES', 'DASHBORD_CONNEXIONS', 'DASHBORD_EXPORT'];
const DASHBORD_INSTRUCTEUR = [
  'DASHBORD_STATS_ASSOCIATIONS',
  'DASHBORD_GRAPHE_STATUT',
  'DASHBORD_EVOLUTION',
  'DASHBORD_EXPORT',
];
const DASHBORD_VALIDATEUR = [
  'DASHBORD_STATS_ASSOCIATIONS',
  'DASHBORD_STATS_EFFECTIFS',
  'DASHBORD_STATS_FINANCEMENT',
  'DASHBORD_GRAPHE_STATUT',
  'DASHBORD_GRAPHE_TYPE',
  'DASHBORD_EVOLUTION',
  'DASHBORD_AIDE_DECISION',
  'DASHBORD_EXPORT',
];
const DASHBORD_DIRECTEUR = [
  'DASHBORD_STATS_ASSOCIATIONS',
  'DASHBORD_STATS_FINANCEMENT',
  'DASHBORD_GRAPHE_STATUT',
  'DASHBORD_CARTES_PROVINCES',
  'DASHBORD_AIDE_DECISION',
  'DASHBORD_EXPORT',
];

const ADMIN_PERMISSIONS = [
  'ACCESS_APP', 'LOG', 'LOG_SYSTEME',
  ...DASHBORD_ADMIN,
  'LIST_REFERENTIEL', 'CREATE_REFERENTIEL', 'UPDATE_REFERENTIEL', 'DELETE_REFERENTIEL',
  'CREATE_USER', 'READ_USER', 'LIST_USER', 'UPDATE_USER', 'DELETE_USER', 'ACTIVATED_USER',
  'CREATE_PERMISSION', 'READ_PERMISSION', 'LIST_PERMISSION', 'UPDATE_PERMISSION', 'DELETE_PERMISSION',
  'CREATE_ROLE', 'READ_ROLE', 'LIST_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE',
];

const INSTRUCTEUR_PERMISSIONS = [
  'ACCESS_APP',
  ...DASHBORD_INSTRUCTEUR,
  'LIST_ORGANISATION', 'READ_ORGANISATION', 'UPDATE_ORGANISATION',
  'LIST_DOMAINE', 'READ_DOMAINE',
  'LIST_PROVINCE', 'READ_PROVINCE', 'LIST_DEPARTEMENT', 'READ_DEPARTEMENT',
];

const VALIDATEUR_PERMISSIONS = [
  ...INSTRUCTEUR_PERMISSIONS.filter((name) => !DASHBORD_INSTRUCTEUR.includes(name)),
  ...DASHBORD_VALIDATEUR,
  'VALIDATE_ORGANISATION', 'PUBLISH_ORGANISATION', 'UNPUBLISH_ORGANISATION',
];

const DIRECTEUR_PERMISSIONS = ['ACCESS_APP', ...DASHBORD_DIRECTEUR];

async function upsertPermission(name: string, description: string) {
  return prisma.permission.upsert({
    where: { name },
    create: { name, description },
    update: { description },
  });
}

async function upsertRole(params: {
  name: string;
  code: string;
  description: string;
  permissions: string[];
  byName: Record<string, { id: string }>;
}) {
  const permissions = params.permissions
    .filter((name) => params.byName[name])
    .map((name) => ({ id: params.byName[name].id }));

  return prisma.role.upsert({
    where: { code: params.code },
    create: {
      name: params.name,
      code: params.code,
      description: params.description,
      permissions: { connect: permissions },
    },
    update: {
      name: params.name,
      description: params.description,
      permissions: { set: permissions },
    },
  });
}

async function upsertUser(email: string, username: string, roleId: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { roleId, activated: true },
    });
    return;
  }
  await prisma.user.create({
    data: {
      email,
      username,
      password,
      activated: true,
      passwordDefault: true,
      roleId,
    },
  });
}

async function main() {
  await upsertPermission('DASHBORD_STATS_ASSOCIATIONS', 'Tableau de bord : indicateurs associations');
  await upsertPermission('DASHBORD_STATS_EFFECTIFS', 'Tableau de bord : effectifs');
  await upsertPermission('DASHBORD_STATS_FINANCEMENT', 'Tableau de bord : financement');
  await upsertPermission('DASHBORD_GRAPHE_STATUT', 'Tableau de bord : graphe des statuts');
  await upsertPermission('DASHBORD_GRAPHE_TYPE', 'Tableau de bord : graphe des types');
  await upsertPermission('DASHBORD_GRAPHE_SEXE', 'Tableau de bord : graphe par sexe');
  await upsertPermission('DASHBORD_GRAPHE_PUBLIC', 'Tableau de bord : graphe public cible');
  await upsertPermission('DASHBORD_CARTES_PROVINCES', 'Tableau de bord : ballonnets par province');
  await upsertPermission('DASHBORD_EVOLUTION', 'Tableau de bord : évolution des dossiers');
  await upsertPermission('DASHBORD_AIDE_DECISION', 'Tableau de bord : aide à la décision');
  await upsertPermission('DASHBORD_COMPTES', 'Tableau de bord : comptes utilisateurs');
  await upsertPermission('DASHBORD_CONNEXIONS', 'Tableau de bord : connexions');
  await upsertPermission('DASHBORD_EXPORT', 'Exporter le tableau de bord');
  await upsertPermission('VALIDATE_ORGANISATION', 'Valider une inscription d’association');
  await upsertPermission('PUBLISH_ORGANISATION', 'Rendre une association visible au public');
  await upsertPermission('UNPUBLISH_ORGANISATION', 'Retirer une association de la visibilité publique');
  await upsertPermission('LIST_REFERENTIEL', 'Administrer les nomenclatures (types, publics, etc.)');
  await upsertPermission('CREATE_REFERENTIEL', 'Créer un référentiel');
  await upsertPermission('UPDATE_REFERENTIEL', 'Mettre à jour un référentiel');
  await upsertPermission('DELETE_REFERENTIEL', 'Supprimer un référentiel');
  await upsertPermission('LOG_SYSTEME', 'Consulter les journaux système');

  const all = await prisma.permission.findMany();
  const byName = Object.fromEntries(all.map((item) => [item.name, item]));

  await upsertRole({
    name: 'Admin',
    code: 'ADMIN',
    description: 'Administrateur de la plateforme',
    permissions: ADMIN_PERMISSIONS,
    byName,
  });

  const instructeur = await upsertRole({
    name: 'Instructeur',
    code: 'INSTRUCTEUR',
    description: 'Instruit les dossiers sans pouvoir les valider',
    permissions: INSTRUCTEUR_PERMISSIONS,
    byName,
  });

  const validateur = await upsertRole({
    name: 'Validateur',
    code: 'VALIDATEUR',
    description: 'Valide les inscriptions et gère la visibilité publique',
    permissions: VALIDATEUR_PERMISSIONS,
    byName,
  });

  const directeur = await upsertRole({
    name: 'Directeur général',
    code: 'DIRECTEUR',
    description: 'Pilotage et aide à la décision',
    permissions: DIRECTEUR_PERMISSIONS,
    byName,
  });

  const ancienGestion = await prisma.role.findUnique({ where: { code: 'GESTION' } });
  if (ancienGestion) {
    await prisma.user.updateMany({
      where: { roleId: ancienGestion.id },
      data: { roleId: instructeur.id },
    });
    await prisma.role.update({
      where: { id: ancienGestion.id },
      data: {
        description: 'Ancien rôle gestionnaire — remplacé par Instructeur / Validateur',
        permissions: { set: [] },
      },
    });
  }

  const password = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@Jeunesse2026', 10);
  await upsertUser('instructeur@jeunesse.ga', 'Instructeur', instructeur.id, password);
  await upsertUser('validateur@jeunesse.ga', 'Validateur', validateur.id, password);
  await upsertUser('dg@jeunesse.ga', 'Directeur général', directeur.id, password);

  console.log('Rôles et permissions de blocs du tableau de bord synchronisés.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
