import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { seedReferentiels } from './referentiels';

require('dotenv').config();

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});

const prisma = new PrismaClient({ adapter });

type ProvinceSeed = {
  nom: string;
  abreviation: string;
  departements: string[];
};

const PROVINCES: ProvinceSeed[] = [
  {
    nom: 'Estuaire',
    abreviation: 'G1',
    departements: ['Komo', 'Komo-Mondah', 'Noya', 'Komo-Océan', 'Libreville'],
  },
  {
    nom: 'Haut-Ogooué',
    abreviation: 'G2',
    departements: [
      'Lékoni-Lékori',
      'Lékoko',
      'Ogooué-Letili',
      'Djouori-Agnili',
      'Djoué',
      'Sébé-Brikolo',
      'Bayi-Brikolo',
      'Lékabi-Léwolo',
      'Mpassa',
      'Plateaux',
      'Lébombi-Leyou',
    ],
  },
  {
    nom: 'Moyen-Ogooué',
    abreviation: 'G3',
    departements: ['Abanga-Bigné', 'Ogooué et des Lacs'],
  },
  {
    nom: 'Ngounié',
    abreviation: 'G4',
    departements: [
      'Mougalaba',
      'Boumi-Louetsi',
      'Dola',
      'Douya-Onoy',
      'Louetsi-Wano',
      'Louetsi-Bibaka',
      'Ogoulou',
      'Ndolou',
      'Tsamba-Magotsi',
    ],
  },
  {
    nom: 'Nyanga',
    abreviation: 'G5',
    departements: ['Douigni', 'Basse-Banio', 'Doutsila', 'Haute-Banio', 'Mongo', 'Mougoutsi'],
  },
  {
    nom: 'Ogooué-Ivindo',
    abreviation: 'G6',
    departements: ['Mvoung', 'Ivindo', 'Lopé', 'Zadié'],
  },
  {
    nom: 'Ogooué-Lolo',
    abreviation: 'G7',
    departements: ['Lombo-Bouenguidi', 'Loffi', 'Offoué-Onoye', 'Mouloundou'],
  },
  {
    nom: 'Ogooué-Maritime',
    abreviation: 'G8',
    departements: ['Bendjé', 'Etimboué', 'Ndougou'],
  },
  {
    nom: 'Woleu-Ntem',
    abreviation: 'G9',
    departements: ['Haut-Ntem', 'Ntem', 'Okano', 'Woleu', 'Haut-Komo'],
  },
];

const DOMAINES_DEFAUT = [
  'Religieux',
  'Développement Communautaire',
  'Projet Entrepreneurial',
  'Éducation',
  'Santé',
  'Environnement',
  'Sport',
  'Culture',
  'Droits humains',
  'Insertion professionnelle',
];

function normalize(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cell(row: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    const exact = row[key];
    if (exact !== undefined && exact !== null && String(exact).trim() !== '') {
      return String(exact).trim();
    }
  }

  const normalizedKeys = keys.map(normalize);
  for (const [header, value] of Object.entries(row)) {
    if (normalizedKeys.includes(normalize(header)) && value !== undefined && value !== null) {
      return String(value).trim();
    }
  }

  return '';
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown): boolean {
  const normalized = normalize(String(value || ''));
  return ['oui', 'yes', 'true', '1', 'o'].includes(normalized);
}

async function main() {
  console.log('🚀 Seeder JEUNESSE-APP');

  await prisma.organisation.deleteMany();
  await prisma.responsable.deleteMany();
  await prisma.domaine.deleteMany();
  await prisma.departement.deleteMany();
  await prisma.province.deleteMany();
  await prisma.referentiel.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  await seedReferentiels(prisma);

  const permissionsData = [
    { name: 'ACCESS_APP', description: "Accès à l'application" },
    { name: 'LOG', description: 'Historique des actions utilisateur' },
    { name: 'ACCESS_APP_MOBILE', description: "Accès à l'application mobile" },
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
    { name: 'CREATE_USER', description: 'Créer un utilisateur' },
    { name: 'READ_USER', description: 'Afficher un utilisateur' },
    { name: 'LIST_USER', description: 'Lister les utilisateurs' },
    { name: 'UPDATE_USER', description: 'Mettre à jour un utilisateur' },
    { name: 'DELETE_USER', description: 'Supprimer un utilisateur' },
    { name: 'ACTIVATED_USER', description: 'Activer/désactiver un utilisateur' },
    { name: 'CREATE_PERMISSION', description: 'Créer une permission' },
    { name: 'READ_PERMISSION', description: 'Lire une permission' },
    { name: 'LIST_PERMISSION', description: 'Lister les permissions' },
    { name: 'UPDATE_PERMISSION', description: 'Mettre à jour une permission' },
    { name: 'DELETE_PERMISSION', description: 'Supprimer une permission' },
    { name: 'CREATE_ROLE', description: 'Créer un rôle' },
    { name: 'READ_ROLE', description: 'Lire un rôle' },
    { name: 'LIST_ROLE', description: 'Lister les rôles' },
    { name: 'UPDATE_ROLE', description: 'Mettre à jour un rôle' },
    { name: 'DELETE_ROLE', description: 'Supprimer un rôle' },
    { name: 'CREATE_ORGANISATION', description: 'Créer une organisation' },
    { name: 'READ_ORGANISATION', description: 'Lire une organisation' },
    { name: 'LIST_ORGANISATION', description: 'Lister les organisations' },
    { name: 'UPDATE_ORGANISATION', description: 'Mettre à jour une organisation' },
    { name: 'DELETE_ORGANISATION', description: 'Supprimer une organisation' },
    { name: 'VALIDATE_ORGANISATION', description: 'Valider une inscription d’association' },
    { name: 'PUBLISH_ORGANISATION', description: 'Rendre une association visible au public' },
    { name: 'UNPUBLISH_ORGANISATION', description: 'Retirer une association de la visibilité publique' },
    { name: 'LOG_SYSTEME', description: 'Consulter les journaux système' },
    { name: 'CREATE_DOMAINE', description: 'Créer un domaine' },
    { name: 'READ_DOMAINE', description: 'Lire un domaine' },
    { name: 'LIST_DOMAINE', description: 'Lister les domaines' },
    { name: 'UPDATE_DOMAINE', description: 'Mettre à jour un domaine' },
    { name: 'DELETE_DOMAINE', description: 'Supprimer un domaine' },
    { name: 'LIST_REFERENTIEL', description: 'Administrer les nomenclatures (types, publics, etc.)' },
    { name: 'CREATE_REFERENTIEL', description: 'Créer un référentiel' },
    { name: 'UPDATE_REFERENTIEL', description: 'Mettre à jour un référentiel' },
    { name: 'DELETE_REFERENTIEL', description: 'Supprimer un référentiel' },
    { name: 'CREATE_PROVINCE', description: 'Créer une province' },
    { name: 'READ_PROVINCE', description: 'Lire une province' },
    { name: 'LIST_PROVINCE', description: 'Lister les provinces' },
    { name: 'UPDATE_PROVINCE', description: 'Mettre à jour une province' },
    { name: 'DELETE_PROVINCE', description: 'Supprimer une province' },
    { name: 'CREATE_DEPARTEMENT', description: 'Créer un département' },
    { name: 'READ_DEPARTEMENT', description: 'Lire un département' },
    { name: 'LIST_DEPARTEMENT', description: 'Lister les départements' },
    { name: 'UPDATE_DEPARTEMENT', description: 'Mettre à jour un département' },
    { name: 'DELETE_DEPARTEMENT', description: 'Supprimer un département' },
  ];

  const permissions: Record<string, { id: string; name: string }> = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.create({ data: perm });
  }

  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      code: 'ADMIN',
      description: 'Administrateur de la plateforme',
      permissions: {
        connect: [
          'ACCESS_APP',
          'LOG',
          'LOG_SYSTEME',
          'DASHBORD_COMPTES',
          'DASHBORD_CONNEXIONS',
          'DASHBORD_EXPORT',
          'LIST_REFERENTIEL',
          'CREATE_REFERENTIEL',
          'UPDATE_REFERENTIEL',
          'DELETE_REFERENTIEL',
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
        ].map((name) => ({ id: permissions[name].id })),
      },
    },
  });

  const instructeurRole = await prisma.role.create({
    data: {
      name: 'Instructeur',
      code: 'INSTRUCTEUR',
      description: 'Instruit les dossiers sans pouvoir les valider',
      permissions: {
        connect: [
          'ACCESS_APP',
          'DASHBORD_STATS_ASSOCIATIONS',
          'DASHBORD_GRAPHE_STATUT',
          'DASHBORD_EVOLUTION',
          'DASHBORD_EXPORT',
          'LIST_ORGANISATION',
          'READ_ORGANISATION',
          'UPDATE_ORGANISATION',
          'LIST_DOMAINE',
          'READ_DOMAINE',
          'LIST_PROVINCE',
          'READ_PROVINCE',
          'LIST_DEPARTEMENT',
          'READ_DEPARTEMENT',
        ].map((name) => ({ id: permissions[name].id })),
      },
    },
  });

  const validateurRole = await prisma.role.create({
    data: {
      name: 'Validateur',
      code: 'VALIDATEUR',
      description: 'Valide les inscriptions et gère la visibilité publique',
      permissions: {
        connect: [
          'ACCESS_APP',
          'DASHBORD_STATS_ASSOCIATIONS',
          'DASHBORD_STATS_EFFECTIFS',
          'DASHBORD_STATS_FINANCEMENT',
          'DASHBORD_GRAPHE_STATUT',
          'DASHBORD_GRAPHE_TYPE',
          'DASHBORD_EVOLUTION',
          'DASHBORD_AIDE_DECISION',
          'DASHBORD_EXPORT',
          'LIST_ORGANISATION',
          'READ_ORGANISATION',
          'UPDATE_ORGANISATION',
          'VALIDATE_ORGANISATION',
          'PUBLISH_ORGANISATION',
          'UNPUBLISH_ORGANISATION',
          'LIST_DOMAINE',
          'READ_DOMAINE',
          'LIST_PROVINCE',
          'READ_PROVINCE',
          'LIST_DEPARTEMENT',
          'READ_DEPARTEMENT',
        ].map((name) => ({ id: permissions[name].id })),
      },
    },
  });

  const directeurRole = await prisma.role.create({
    data: {
      name: 'Directeur général',
      code: 'DIRECTEUR',
      description: 'Pilotage et aide à la décision',
      permissions: {
        connect: [
          'ACCESS_APP',
          'DASHBORD_STATS_ASSOCIATIONS',
          'DASHBORD_STATS_FINANCEMENT',
          'DASHBORD_GRAPHE_STATUT',
          'DASHBORD_CARTES_PROVINCES',
          'DASHBORD_AIDE_DECISION',
          'DASHBORD_EXPORT',
        ].map((name) => ({ id: permissions[name].id })),
      },
    },
  });

  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@Jeunesse2026';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@jeunesse.ga',
      username: 'Administrateur',
      activated: true,
      passwordDefault: true,
      password: hashedPassword,
      role: { connect: { id: adminRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: 'instructeur@jeunesse.ga',
      username: 'Instructeur',
      activated: true,
      passwordDefault: true,
      password: hashedPassword,
      role: { connect: { id: instructeurRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: 'validateur@jeunesse.ga',
      username: 'Validateur',
      activated: true,
      passwordDefault: true,
      password: hashedPassword,
      role: { connect: { id: validateurRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: 'dg@jeunesse.ga',
      username: 'Directeur général',
      activated: true,
      passwordDefault: true,
      password: hashedPassword,
      role: { connect: { id: directeurRole.id } },
    },
  });

  const provinceIndex = new Map<string, { id: string; nom: string; departements: { id: string; nom: string }[] }>();
  const departementIndex = new Map<string, { id: string; nom: string; provinceId: string }>();

  for (const provinceData of PROVINCES) {
    const province = await prisma.province.create({
      data: {
        nom: provinceData.nom,
        abreviation: provinceData.abreviation,
        departements: {
          create: provinceData.departements.map((nom) => ({ nom })),
        },
      },
      include: { departements: true },
    });

    provinceIndex.set(normalize(province.nom), {
      id: province.id,
      nom: province.nom,
      departements: province.departements,
    });
    provinceIndex.set(normalize(province.abreviation), {
      id: province.id,
      nom: province.nom,
      departements: province.departements,
    });

    for (const departement of province.departements) {
      departementIndex.set(normalize(departement.nom), {
        id: departement.id,
        nom: departement.nom,
        provinceId: province.id,
      });
    }
  }

  const domaineIndex = new Map<string, { id: string; nom: string }>();
  for (const nom of DOMAINES_DEFAUT) {
    const domaine = await prisma.domaine.create({ data: { nom } });
    domaineIndex.set(normalize(nom), domaine);
  }

  const resolveDepartements = (rawZones: string): string[] => {
    if (!rawZones) {
      return [];
    }

    const tokens = rawZones
      .split(/[,;/|]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const ids = new Set<string>();

    for (const token of tokens) {
      const key = normalize(token);
      const departement = departementIndex.get(key);
      if (departement) {
        ids.add(departement.id);
        continue;
      }

      const province = provinceIndex.get(key);
      if (province) {
        province.departements.forEach((item) => ids.add(item.id));
      }
    }

    return [...ids];
  };

  const resolveDomaines = async (rawDomaines: string): Promise<string[]> => {
    const names = rawDomaines
      .split(/[,;/|]+/)
      .map((name) => name.trim())
      .filter(Boolean);

    const ids: string[] = [];
    for (const name of names.length ? names : ['Développement Communautaire']) {
      const key = normalize(name);
      let domaine = domaineIndex.get(key);
      if (!domaine) {
        domaine = await prisma.domaine.upsert({
          where: { nom: name },
          update: {},
          create: { nom: name },
        });
        domaineIndex.set(key, domaine);
      }
      ids.push(domaine.id);
    }
    return ids;
  };

  let orgCount = 0;
  let pendingCount = 0;
  const excelPath = path.join(process.cwd(), 'prisma', 'ass.xlsx');

  if (fs.existsSync(excelPath)) {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    for (const [index, row] of rows.entries()) {
      try {
        const nom = cell(
          row,
          "Quel est le nom de votre OSC ?",
          'Nom de votre OSC',
          'Nom de l’association',
          'nom',
        );
        if (!nom || normalize(nom) === 'inconnu') {
          continue;
        }

        const nomResponsable = cell(
          row,
          'Nom et Prénoms du principal responsable de la structure ?',
          'Nom et Prénom(s) du Responsable :',
          'Responsable',
        );

        const zones = cell(
          row,
          "Veuillez sélectionner vos zones d'intervention dans la liste suivante :",
          'Zones',
          'Province',
        );
        const departementIds = resolveDepartements(zones);
        const fallbackEstuaire = provinceIndex.get(normalize('Estuaire'));
        const connectedDepartements =
          departementIds.length > 0
            ? departementIds
            : fallbackEstuaire
              ? [fallbackEstuaire.departements[0].id]
              : [];

        const domaineIds = await resolveDomaines(
          cell(row, "Quels est son domaine d’intervention ?", "Quel est son domaine d'intervention ?", 'Domaine'),
        );

        const responsable = await prisma.responsable.create({
          data: {
            nom: nomResponsable || 'Responsable non renseigné',
            age: toNumber(cell(row, "Quelle est l'âge du responsable ? (en années)", 'Age')),
            nationalite: cell(row, 'Veuillez entrer la nationalité du responsable', 'Nationalité') || 'Gabonaise',
            situation: cell(row, 'Quelle est sa situation professionnelle ?', 'Situation'),
            telephone: cell(row, 'N° de téléphone :', 'N° de téléphone', 'Téléphone'),
            email: cell(row, 'Adresse courriel :', 'Courriel :', 'Email') || null,
            adresse: cell(row, 'Adresse :', "Quelle est l'adresse du Siège de votre OSC ?"),
          },
        });

        const activated = index % 7 !== 0;
        await prisma.organisation.create({
          data: {
            nom,
            sigle: cell(row, 'Quel est le sigle ?', 'Sigle') || null,
            type: cell(row, 'Quel est le type de votre OSC ?', 'Type') || 'Association',
            anneeCreation: toNumber(cell(row, 'En quelle année à t-elle été crée ?', 'Année')),
            agrementTechniqueDelivred: toBoolean(cell(row, 'Avez vous un agrément technique ?')),
            adresse: cell(row, "Quelle est l'adresse du Siège de votre OSC ?", 'Adresse siège') || null,
            commune: cell(row, 'Commune de ESTUAIRE', 'Commune') || null,
            international: toBoolean(cell(row, 'Est vous présent au niveau international ?')),
            groupes: toNumber(cell(row, 'En combien de groupes êtes vous subdivisé ?')),
            adherents: toNumber(cell(row, "Nombre d'Adhérents de votre OSC ?")),
            hommes: toNumber(cell(row, 'Parmi vos adhérents, combien sont des hommes ?')),
            femmes: toNumber(cell(row, 'Parmi vos adhérents, combien sont des femmes ?')),
            salaries: toNumber(cell(row, 'Parmi vos adhérents, combien sont des salariés ?')),
            benevoles: toNumber(cell(row, 'Combien sont des bénévoles ?')),
            cotisationMensuelle: toNumber(cell(row, 'Quel est le montant des cotisations mensuelles ?')),
            partenaires: cell(row, 'Si oui, lequel / lesquels', 'Partenaires') || null,
            but: cell(row, `Quel est "Le BUT" visé par l'association ?`, 'But') || null,
            publicCible: cell(row, 'Quel est le Public ciblé ?', 'Public cible') || null,
            activated,
            responsable: { connect: { id: responsable.id } },
            domaines: { connect: domaineIds.map((id) => ({ id })) },
            departements: { connect: connectedDepartements.map((id) => ({ id })) },
          },
        });

        orgCount += 1;
        if (!activated) {
          pendingCount += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Ligne ${index + 1} ignorée: ${message}`);
      }
    }
  } else {
    console.warn('⚠️ Fichier prisma/ass.xlsx introuvable — organisations de démonstration uniquement.');
  }

  if (orgCount === 0) {
    const estuaire = provinceIndex.get(normalize('Estuaire'));
    const hautOgooue = provinceIndex.get(normalize('Haut-Ogooué'));
    const communautaire = domaineIndex.get(normalize('Développement Communautaire'));
    const education = domaineIndex.get(normalize('Éducation'));

    const demoOrgs = [
      {
        nom: 'Mouvement des Jeunes pour le Développement',
        sigle: 'MJD',
        commune: 'Libreville',
        activated: true,
        departements: estuaire?.departements.filter((item) => ['Libreville', 'Komo-Mondah'].includes(item.nom)) || [],
        domaines: [communautaire, education].filter(Boolean),
      },
      {
        nom: 'Association Culturelle du Haut-Ogooué',
        sigle: 'ACHO',
        commune: 'Franceville',
        activated: true,
        departements: hautOgooue?.departements.filter((item) => item.nom === 'Mpassa') || [],
        domaines: [domaineIndex.get(normalize('Culture'))].filter(Boolean),
      },
      {
        nom: 'Collectif Jeunesse en Attente',
        sigle: 'CJA',
        commune: 'Owendo',
        activated: false,
        departements: estuaire?.departements.filter((item) => item.nom === 'Libreville') || [],
        domaines: [communautaire].filter(Boolean),
      },
    ];

    for (const demo of demoOrgs) {
      const responsable = await prisma.responsable.create({
        data: {
          nom: `Responsable ${demo.sigle}`,
          nationalite: 'Gabonaise',
          telephone: '077000000',
          email: `${demo.sigle.toLowerCase()}@jeunesse.ga`,
        },
      });

      await prisma.organisation.create({
        data: {
          nom: demo.nom,
          sigle: demo.sigle,
          type: 'Association',
          anneeCreation: 2018,
          agrementTechniqueDelivred: true,
          adresse: `Siège ${demo.commune}`,
          commune: demo.commune,
          international: false,
          adherents: 40,
          hommes: 18,
          femmes: 22,
          but: "Promouvoir l'engagement des jeunes et faciliter leur accès aux opportunités.",
          publicCible: '15 à 35 ans',
          activated: demo.activated,
          responsable: { connect: { id: responsable.id } },
          domaines: { connect: demo.domaines.map((item) => ({ id: item!.id })) },
          departements: { connect: demo.departements.map((item) => ({ id: item.id })) },
        },
      });
      orgCount += 1;
      if (!demo.activated) {
        pendingCount += 1;
      }
    }
  }

  console.log(`✅ ${orgCount} organisations importées (${pendingCount} en attente de validation)`);
  console.log(`👤 Admin: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@jeunesse.ga'}`);
  console.log(`🔑 Mot de passe initial: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@Jeunesse2026'}`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur dans le seeder :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🏁 Seeder terminé.');
  });
