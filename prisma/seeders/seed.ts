
import { PrismaClient } from '@prisma/client';
import * as process from 'process';
import * as bcrypt from "bcryptjs";

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

  // **2. Créer les type de candidat de base l'application **/
 const listTypeCandidat = await prisma.typeCandidat.createMany({
    data: [
      { name: "Femmes individuelles", description: "Femmes individuelles exerçant dans le DIGITAL."},
      { name: "Entreprises", description: "Entreprises usant du digital dans ses services ou faisant la promotion du digital"},
    ],
  });
  console.log("Liste des types de candidat => OK");
 
  /** FIN */

  // **3.  Créer les groupe de base l'applicatione**
 const listeGroupe = await prisma.groupe.createMany({
    data: [
      { name: "Groupe d'Influence", description : "Groupe d'influence du digital"},
      { name: "Groupe Technique", description : "Groupe technique du digital"},
    ],
  });

  console.log("Liste des groupes de candidat => OK");
  /** FIN */

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
