import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

require('dotenv').config();

const adapter = new PrismaPg({
  connectionString: String(process.env.DATABASE_URL),
});

const prisma = new PrismaClient({ adapter });

import * as XLSX from 'xlsx';


async function main() {
  console.log('🚀 Début du seeder...');

  // Nettoyer les tables dans l'ordre (respect des FK)
  await prisma.organisation.deleteMany();
  await prisma.responsable.deleteMany();
  await prisma.domaine.deleteMany();
  await prisma.departement.deleteMany();
  await prisma.province.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  console.log('🧹 Base nettoyée.');

  /** Permissions */
  const permissionsData = [
    { name: "ACCESS_APP", description: "Acces à l'application" },
    { name: "LOG", description: "Historique des actions utilisateur" },
    { name: "ACCESS_APP_MOBILE", description: "Acces à l'application mobile" },
    { name: "DASHBORD_ADMIN", description: "Accès au tableau de bord" },

    // Utilisateurs
    { name: "CREATE_USER", description: "Créer un utilisateur" },
    { name: "READ_USER", description: "Afficher un utilisateur" },
    { name: "LIST_USER", description: "Lister les utilisateurs" },
    { name: "UPDATE_USER", description: "Mettre à jour un utilisateur" },
    { name: "DELETE_USER", description: "Supprimer un utilisateur" },
    { name: "ACTIVATED_USER", description: "Activer/désactiver un utilisateur" },

    // Permissions
    { name: "CREATE_PERMISSION", description: "Créer une permission" },
    { name: "READ_PERMISSION", description: "Lire une permission" },
    { name: "LIST_PERMISSION", description: "Lister les permissions" },
    { name: "UPDATE_PERMISSION", description: "Mettre à jour une permission" },
    { name: "DELETE_PERMISSION", description: "Supprimer une permission" },

    // Rôles
    { name: "CREATE_ROLE", description: "Créer un rôle" },
    { name: "READ_ROLE", description: "Lire un rôle" },
    { name: "LIST_ROLE", description: "Lister les rôles" },
    { name: "UPDATE_ROLE", description: "Mettre à jour un rôle" },
    { name: "DELETE_ROLE", description: "Supprimer un rôle" },

    // Organisations
    { name: "CREATE_ORGANISATION", description: "Créer une organisation" },
    { name: "READ_ORGANISATION", description: "Lire une organisation" },
    { name: "LIST_ORGANISATION", description: "Lister les organisations" },
    { name: "UPDATE_ORGANISATION", description: "Mettre à jour une organisation" },
    { name: "DELETE_ORGANISATION", description: "Supprimer une organisation" },

    // Domaines
    { name: "CREATE_DOMAINE", description: "Créer un domaine" },
    { name: "READ_DOMAINE", description: "Lire un domaine" },
    { name: "LIST_DOMAINE", description: "Lister les domaines" },
    { name: "UPDATE_DOMAINE", description: "Mettre à jour un domaine" },
    { name: "DELETE_DOMAINE", description: "Supprimer un domaine" },

    // Provinces
    { name: "CREATE_PROVINCE", description: "Créer une province" },
    { name: "READ_PROVINCE", description: "Lire une province" },
    { name: "LIST_PROVINCE", description: "Lister les provinces" },
    { name: "UPDATE_PROVINCE", description: "Mettre à jour une province" },
    { name: "DELETE_PROVINCE", description: "Supprimer une province" },


    // departements
    { name: "CREATE_DEPARTEMENT", description: "Créer un département" },
    { name: "READ_DEPARTEMENT", description: "Lire un département" },
    { name: "LIST_DEPARTEMENT", description: "Lister les départements" },
    { name: "UPDATE_DEPARTEMENT", description: "Mettre à jour un département" },
    { name: "DELETE_DEPARTEMENT", description: "Supprimer un département" },

    // Candidats
    { name: "NOTER_CANDIDAT", description: "Noter un candidat" },
    { name: "CONSULTER_RESULTAT", description: "Consulter les résultats" },
  ];

  const permissions = {};
  for (const perm of permissionsData) {
    const created = await prisma.permission.create({ data: perm });
    permissions[perm.name] = created;
  }

  console.log('✅ Permissions insérées.');

  /** Rôles + Users */
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      code: "ADMIN",
      description: "Administre la plateforme",
      permissions: {
        connect: Object.values(permissions).map((p: any) => ({ id: p.id })),
      },
    },
  });

  const gestionnaireRole = await prisma.role.create({
    data: {
      name: "Gestionnaire",
      code: "GESTION",
      description: "Gestionnaire avec accès limité",
      permissions: {
        connect: [
          { id: permissions["ACCESS_APP"].id },
          { id: permissions["LOG"].id },
          { id: permissions["ACCESS_APP_MOBILE"].id },
          { id: permissions["DASHBORD_ADMIN"].id },
          { id: permissions["CREATE_USER"].id },
          { id: permissions["READ_USER"].id },
          { id: permissions["LIST_USER"].id },
          { id: permissions["UPDATE_USER"].id },
          { id: permissions["ACTIVATED_USER"].id },
        ],
      },
    },
  });

  const defaultPassword = await bcrypt.hash("azerty", 10);

  await prisma.user.create({
    data: {
      email: "admin@test.ga",
      username: "Jhon DOE",
      activated: true,
      password: defaultPassword,
      role: { connect: { id: adminRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: "gestionnaire@test.ga",
      username: "Jane DOE",
      activated: true,
      password: defaultPassword,
      role: { connect: { id: gestionnaireRole.id } },
    },
  });

  console.log('✅ Rôles et utilisateurs insérés.');

  /** Provinces + Départements */
  const provincesData = [
    {
      nom: 'Estuaire',
      abreviation: 'G1',
      departements: ['Komo', 'Komo-Mondah', 'Noya', 'Komo-Océan']
    },
    {
      nom: 'Haut-Ogooué',
      abreviation: 'G2',
      departements: ['Lékoni-Lékori', 'Lékoko', 'Ogooué-Létili', 'Djouori-Agnili', 'Djoué', 'Sébé-Brikolo', 'Bayi-Brikolo', 'Lékabi-Léwolo', 'Mpassa', 'Plateaux']
    },
    {
      nom: 'Moyen-Ogooué',
      abreviation: 'G3',
      departements: ['Abanga-Bigné', 'Ogooué et des Lacs']
    },
    {
      nom: 'Ngounié',
      abreviation: 'G4',
      departements: ['Mougalaba', 'Boumi-Louetsi', 'Dola', 'Douya-Onoy', 'Louetsi-Wano', 'Louetsi-Bibaka', 'Ogoulou', 'Ndolou', 'Tsamba-Magotsi']
    },
    {
      nom: 'Nyanga',
      abreviation: 'G5',
      departements: ['Douigni', 'Basse-Banio', 'Doutsila', 'Haute-Banio', 'Mongo', 'Mougoutsi']
    },
    {
      nom: 'Ogooué-Ivindo',
      abreviation: 'G6',
      departements: ['Mvoung', 'Ivindo', 'Lopé', 'Zadié']
    },
    {
      nom: 'Ogooué-Lolo',
      abreviation: 'G7',
      departements: ['Lombo-Bouenguidi', 'Loffi', 'Offoué-Onoye', 'Mouloundou']
    },
    {
      nom: 'Ogooué-Maritime',
      abreviation: 'G8',
      departements: ['Bendjé', 'Etimboué', 'Ndougou']
    },
    {
      nom: 'Woleu-Ntem',
      abreviation: 'G9',
      departements: ['Haut-Ntem', 'Ntem', 'Okano', 'Woleu']
    },
  ];


  for (const provinceData of provincesData) {
    await prisma.province.create({
      data: {
        nom: provinceData.nom,
        abreviation: provinceData.abreviation,
        departements: {
          create: provinceData.departements.map(nom => ({ nom }))
        }
      },
    });
  }

  console.log("✅ Provinces et départements créés");


  // ========== AJOUT DES DOMAINES PAR DÉFAUT ==========
  const domainesParDefaut = [
    "Religieux",
    "Développement Communautaire",
    "Projet Entrepreneurial"
  ];

  console.log("\n🏷️ Création des domaines par défaut...");

  for (const nomDomaine of domainesParDefaut) {
    await prisma.domaine.upsert({
      where: { nom: nomDomaine },
      update: {},
      create: { nom: nomDomaine },
    });
    console.log(`  ✅ Domaine "${nomDomaine}" créé/vérifié`);
  }

  console.log("✅ Domaines par défaut créés");



  // Lecture du fichier Excel
  const workbook = XLSX.readFile('prisma/ass.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  let orgCount = 0;
  let errorCount = 0;

  for (const [index, row] of data.entries()) {
    try {
      console.log(`\n📝 Traitement de l'organisation ${index + 1}/${data.length}`);

      const nomResponsable = row['Nom et Prénoms du principal responsable de la structure ?']?.trim();
      if (!nomResponsable) {
        console.log('⏭️ Aucun responsable, skip...');
        continue;
      }

      // Gestion des départements
      const nomProvince = row["Veuillez sélectionner vos zones d'intervention dans la liste suivante :"]?.trim();
      const departementIds: string[] = [];

      if (nomProvince) {
        const zones = nomProvince.split(/\s*,\s*/).map(zone => zone.trim());

        for (const zone of zones) {
          const departement = await prisma.departement.findFirst({
            where: {
              nom: {
                contains: zone,
                mode: 'insensitive'
              }
            }
          });

          if (departement) {
            departementIds.push(departement.id);
          } else {
            const province = await prisma.province.findFirst({
              where: {
                nom: {
                  contains: zone,
                  mode: 'insensitive'
                }
              },
              include: { departements: true }
            });

            if (province && province.departements.length > 0) {
              departementIds.push(province.departements[0].id);
              console.warn(`⚠️ Département non trouvé pour: "${zone}", utilisé: "${province.departements[0].nom}"`);
            }
          }
        }
      }

      const uniqueDepartementIds = [...new Set(departementIds)];

      // Responsable
      const responsable = await prisma.responsable.upsert({
        where: { nom: nomResponsable },
        update: {},
        create: {
          nom: nomResponsable,
          age: Number(row["Quelle est l'âge du responsable ? (en années)"]) || null,
          nationalite: row['Veuillez entrer la nationalité du responsable'] || null,
          situation: row['Quelle est sa situation professionnelle ?'] || null,
          telephone: row['N° de téléphone :']?.toString() || null,
          email: row['Adresse courriel :'] || null,
          adresse: row["Adresse :"] || null,
        },
      });

      // Domaine(s) - CORRECTION ICI
      const domainesNoms = (row["Quels est son domaine d’intervention ?"] || "")
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);


      // Créer ou connecter les domaines d'abord
      const domaineOperations = [];
      for (const nomDomaine of domainesNoms) {

        if (nomDomaine) {
          domaineOperations.push(
            prisma.domaine.upsert({
              where: { nom: nomDomaine },
              update: {},
              create: { nom: nomDomaine },
            })
          );
        }
      }

      const domainesCrees = await Promise.all(domaineOperations);
      const domaineIds = domainesCrees.map(d => ({ id: d.id }));
      /*
            // Organisation
            const orga = await prisma.organisation.create({
              data: {
                nom: row["Quel est le nom de votre OSC ?"] || "Inconnu",
                sigle: row["Quel est le sigle ?"] || null,
                type: row["Quel est le type de votre OSC ?"] || null,
                anneeCreation: Number(row["En quelle année à t-elle été crée ?"]) || null,
                agrementTechniqueDelivred: row["Avez vous un agrément technique ?"] === "Oui",
                adresse: row["Quelle est l'adresse du Siège de votre OSC ?"] || null,
                commune: row["Commune de ESTUAIRE"] || null,
                international: row["Est vous présent au niveau international ?"] === "Oui",
                groupes: Number(row["En combien de groupes êtes vous subdivisé ?"]) || null,
                adherents: Number(row["Nombre d'Adhérents de votre OSC ?"]) || null,
                hommes: Number(row["Parmi vos adhérents, combien sont des hommes ?"]) || null,
                femmes: Number(row["Parmi vos adhérents, combien sont des femmes ?"]) || null,
                salaries: Number(row["Parmi vos adhérents, combien sont des salariés ?"]) || null,
                benevoles: Number(row["Combien sont des bénévoles ?"]) || null,
                cotisationMensuelle: Number(row["Quel est le montant des cotisations mensuelles ?"]) || null,
                partenaires: row["Si oui, lequel / lesquels"] || null,
                but: row[`Quel est "Le BUT" visé par l'association ?`] || null,
                publicCible: row["Quel est le Public ciblé ?"] || null,
                zones: Object.keys(row)
                  .filter((key) => key.startsWith("Veuillez sélectionner vos zones d'intervention") && row[key] === 1)
                  .map((key) => key.split("/")[1]),
                responsable: {
                  connect: { id: responsable.id },
                },
                domaines: {
                  connect: domaineIds, // Utilisation directe des IDs
                },
                departements: {
                  connect: uniqueDepartementIds.map(id => ({ id })),
                },
              },
            });
      
            // Contact
            const nomContact = row["Nom et Prénom(s) du Responsable :"]?.trim();
            if (nomContact && nomContact !== nomResponsable) {
              await prisma.contact.create({
                data: {
                  nom: nomContact,
                  telephone: "0" + row["N° de téléphone"]?.toString() || null,
                  email: row["Courriel :"] || null,
                  organisationId: orga.id,
                },
              });
            }
      
            orgCount++;
            console.log(`✅ Organisation "${orga.nom}" créée avec ${domaineIds.length} domaine(s)`);
      
             */

    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur sur l'organisation ${index + 1}:`, error.message);
    }
  }

  console.log(`\n🎉 Résumé : ${orgCount} organisations créées, ${errorCount} erreurs`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur dans le seeder :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🏁 Seeder terminé.');
  });