
import { PrismaClient } from '@prisma/client';
import * as process from 'process';
import * as bcrypt from "bcryptjs";
import * as XLSX from 'xlsx';


const prisma = new PrismaClient();

async function main() {

  console.log('Début des seeders 🏁 ---> 🔥');

  const accesApp = await prisma.permission.create({
    data: {
      name: "ACCESS_APP",
      description: "Acces a l'application",
    },
  });

  const log = await prisma.permission.create({
    data: {
      name: "LOG",
      description: "Histotrique des action d'un utilisateur",
    },
  });

  const accesAppMobile = await prisma.permission.create({
    data: {
      name: "ACCESS_APP_MOBILE",
      description: "Acces a l'application",
    },
  });

  const dashboardAdmin = await prisma.permission.create({
    data: {
      name: "DASHBORD_ADMIN",
      description: "Acces au tableau de bord de l'administration",
    },
  });

  /** Permission d"accès aux utilisateurs */
  const createUser = await prisma.permission.create({
    data: {
      name: "CREATE_USER",
      description: "Créer un utilisateur",
    },
  });

  const readUser = await prisma.permission.create({
    data: {
      name: "READ_USER",
      description: "Afficher un utilisateur",
    },
  });

  const listUser = await prisma.permission.create({
    data: {
      name: "LIST_USER",
      description: "Lister les utilisateurs",
    },
  });

  const updateUser = await prisma.permission.create({
    data: {
      name: "UPDATE_USER",
      description: "Mettre à jour un utilisateur",
    },
  });

  const deleteUser = await prisma.permission.create({
    data: {
      name: "DELETE_USER",
      description: "Supprimer un utilisateur",
    },
  });

  const activatedUser = await prisma.permission.create({
    data: {
      name: "ACTIVATED_USER",
      description: "Activer et desactiver un utilisateur",
    },
  });
  /** Fin */

  /** Permission d"accès aux permissions */
  const createPermission = await prisma.permission.create({
    data: {
      name: "CREATE_PERMISSION",
      description: "Créer une permission",
    },
  });

  const readPermission = await prisma.permission.create({
    data: {
      name: "READ_PERMISSION",
      description: "Afficher une permission",
    },
  });

  const listPermission = await prisma.permission.create({
    data: {
      name: "LIST_PERMISSION",
      description: "Lister les permissions",
    },
  });

  const updatePermission = await prisma.permission.create({
    data: {
      name: "UPDATE_PERMISSION",
      description: "Mettre à jour une permission",
    },
  });

  const deletePermission = await prisma.permission.create({
    data: {
      name: "DELETE_PERMISSION",
      description: "Supprimer une permission",
    },
  });
  /** Fin */

  /** Permission d"accès aux roles */
  const createRole = await prisma.permission.create({
    data: {
      name: "CREATE_ROLE",
      description: "Créer un role",
    },
  });

  const readRole = await prisma.permission.create({
    data: {
      name: "READ_ROLE",
      description: "Afficher un role",
    },
  });

  const listRole = await prisma.permission.create({
    data: {
      name: "LIST_ROLE",
      description: "Lister les roles",
    },
  });

  const updateRole = await prisma.permission.create({
    data: {
      name: "UPDATE_ROLE",
      description: "Mettre à jour un role",
    },
  });

  const deleteRole = await prisma.permission.create({
    data: {
      name: "DELETE_ROLE",
      description: "Supprimer un role",
    },
  });

  const noterCandidat = await prisma.permission.create({
    data: {
      name: "NOTER_CANDIDAT",
      description: "Noter un candidat",
    },
  });

  const consulterResultat = await prisma.permission.create({
    data: {
      name: "CONSULTER_RESULTAT",
      description: "Consulter les resultats",
    },
  });

  console.log("Liste des permission => OK");

  /** Fin */

  // **2. Créer des rôles par défaut avec des codes et permissions**
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      code: "ADMIN",
      description : "Il administre la plateform sans avoir acces à la partie metier",
      permissions: {
        connect: [
          { id: accesApp.id },
          { id: log.id },
          { id: dashboardAdmin.id },
          { id: createUser.id },
          { id: readUser.id },
          { id: listUser.id },
          { id: updateUser.id },
          { id: activatedUser.id },
          { id: deleteUser.id },
          { id: createPermission.id },
          { id: readPermission.id },
          { id: listPermission.id },
          { id: updatePermission.id },
          { id: deletePermission.id },
          { id: createRole.id },
          { id: readRole.id },
          { id: listRole.id },
          { id: updateRole.id },
          { id: deleteRole.id },
        ],
      },
    },
  });

  const gestionaire = await prisma.role.create({
    data: {
      name: "Gestionnaire",
      code: "GESTION",
      description : "Il administre la plateform avec les permissions necessaires",
      permissions: {
        connect: [
          { id: accesApp.id },
          { id: log.id },
          { id: accesAppMobile.id },
          { id: dashboardAdmin.id },
          { id: createUser.id },
          { id: readUser.id },
          { id: listUser.id },
          { id: updateUser.id },
          { id: activatedUser.id },
        ],
      },
    },
  });

  const membreJury = await prisma.role.create({
    data: {
      name: "Membre de jury",
      code: "JURY",
      description : "Il évalue les candidats",
      permissions: {
        connect: [
          { id: accesAppMobile.id },
          { id: log.id },
          { id: noterCandidat.id },
          { id: consulterResultat.id },
        ],
      },
    },
  });

  const simpleUser = await prisma.role.create({
    data: {
      name: "Simple utilisateur",
      code: "SIMPLE_USER",
      description : "Il candidate aux differents categories",
      permissions: {
        connect: [
          { id: accesAppMobile.id },
          { id: log.id }, 
          { id: consulterResultat.id },
        ],
      },
    },
  });

  const defaultPassword = await bcrypt.hash("azerty", 10);
  const adminUser = await prisma.user.create({
    data: {
      email: "hamiltondarryl24@gmail.com",
      username: "MAHANGA Hamilton",
      activated: true,
      password: defaultPassword, // Hash le mot de passe en production !
      role: {
        connect: { id: adminRole.id },
      },
    },
  });

  const gestionaireUser = await prisma.user.create({
    data: {
      email: "darryl24@gmail.com",
      username: "BOULINGUI Darryl",
      activated: true,
      password: defaultPassword, // Hash le mot de passe en production !
      role: {
        connect: { id: gestionaire.id },
      },
    },
  });

  console.log("Liste des roles => OK");
  /** FIN */

  const provinces = [
    { nom: 'Estuaire', abbr: 'G1' },
    { nom: 'Haut-Ogooué', abbr: 'G2' },
    { nom: 'Moyen-Ogooué', abbr: 'G3' },
    { nom: 'Ngounié', abbr: 'G4' },
    { nom: 'Nyanga', abbr: 'G5' },
    { nom: 'Ogooué-Ivindo', abbr: 'G6' },
    { nom: 'Ogooué-Lolo', abbr: 'G7' },
    { nom: 'Ogooué-Maritime', abbr: 'G8' },
    { nom: 'Woleu-Ntem', abbr: 'G9' },
  ];
  
  for (const { nom, abbr } of provinces) {
    await prisma.province.upsert({
      where: { nom },
      update: {},
      create: {
        nom,
        anbreviation: abbr,
      },
    });
  }



  const workbook = XLSX.readFile('prisma/ass.xlsx'); // renomme ton fichier ici
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  for (const row of data) {
    console.log(row["Quel est le nom de votre OSC ?"]);

  }
  // 3. Boucle de seed
  for (const row of data) {
    
    const nomResponsable = row['Nom et Prénoms du principal responsable de la structure ?']?.trim();
    if (!nomResponsable) continue;

    // Province
    const nomProvince = row["Veuillez sélectionner vos zones d'intervention dans la liste suivante :"]?.trim();
    let provinceConnect = [];

   if (nomProvince) {

    const provincesP = nomProvince.split(/\s+/).map((zone: string) => zone.trim());

    for (const prov of provincesP) {
      if (prov) {
        const provinceGet = await prisma.province.findFirst({
          where: { nom: { contains: prov, mode: 'insensitive' } },
        });
        if (provinceGet) {
          provinceConnect.push({ id: provinceGet.id }); 
        } else {
          const estuaireProvince = await prisma.province.findFirst({
            where: { nom: { contains: "Estuaire", mode: 'insensitive' } },
          })
          provinceConnect.push({ connect: { id: estuaireProvince?.id } });
          console.warn(`⚠️ Province non trouvée pour : "${nomProvince}"`);
        }
      }
    }

   }else{
    console.warn(`⚠️ -------------`);
   }

    

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

    // Domaine(s)
    const domaines = (row["Quels est son domaine d’intervention ?"] || "")
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const domaineConnections = await Promise.all(
      domaines.map(async (domaine) => {
        return {
          where: { nom: domaine },
          create: { nom: domaine },
        };
      })
    );

    // Organisation
    const orga = await prisma.organisation.create({
      data: {
        nom: row["Quel est le nom de votre OSC ?"] || "Inconnu",
        sigle: row["Quel est le sigle ?"] || null,
        type: row["Quel est le type de votre OSC ?"] || null,
        anneeCreation: Number(row["En quelle année à t-elle été crée ?"]) || null,
        agrementTechnique: row["Avez vous un agrément technique ?"] === "Oui",
        adresse: row["Quelle est l'adresse du Siège de votre OSC ?"] || null,
        commune: row["Commune de ESTUAIRE"] || null,
        international: row["Est vous présent au niveau international ?"] === "Oui",
        groupes: Number(row["En combien de groupes êtes vous subdivisé ?"]) || null,
        adherents: Number(row["Nombre d’Adhérents  de votre OSC ?"]) || null,
        hommes: Number(row["Parmi vos adhérents, combien sont des hommes ?"]) || null,
        femmes: Number(row["Parmi vos adhérents, combien sont des femmes ?"]) || null,
        salaries: Number(row["Parmi vos adhérents, combien sont des salariés ?"]) || null,
        benevoles: Number(row["Combien sont des bénévoles ?"]) || null,
        cotisationMensuelle: Number(row["Quel est le montant des cotisations mensuelles ?"]) || null,
        partenaires: row["Avez vous des partenaires officiels ?"] === "Oui",
        but: row[`Quel est "Le BUT" visé par l'association ?`] || null,
        publicCible: row["Quel est le Public ciblé ?"] || null,
        zones: Object.keys(row)
          .filter((key) => key.startsWith("Veuillez sélectionner vos zones d'intervention") && row[key] === 1)
          .map((key) => key.split("/")[1]),
        responsable: {
          connect: { nom: nomResponsable },
        },
        domaines: {
          connectOrCreate: domaineConnections,
        },
        provinces: {
          connect: provinceConnect, // Utilisation de provinceConnect
        },
        // Ajout des provinces
      },
    });

    // Contact (si différent du responsable)
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
  }

  console.log('✅ Base de données remplie avec succès');

  console.log("Seed terminé avec succès 😍 , 🎉 🎉 🎉 🎉 🎉");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
