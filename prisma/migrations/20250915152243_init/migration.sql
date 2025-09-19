-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('LOGIN', 'LOGOUT', 'OTHER', 'PASSWORD_RESET', 'PASSWORD_CHANGE', 'FORGOT_PASSWORD', 'ACCOUNT_CREATED', 'ACCOUNT_ACTIVATION');

-- CreateEnum
CREATE TYPE "TypeOSC" AS ENUM ('ONG', 'Association', 'Coopérative', 'Autre');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('Masculin', 'Féminin');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "passwordIsRest" BOOLEAN NOT NULL DEFAULT false,
    "fcmToken" TEXT,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sigle" TEXT,
    "type" TEXT,
    "anneeCreation" INTEGER,
    "agrementTechniqueDelivred" BOOLEAN NOT NULL,
    "adresse" TEXT,
    "commune" TEXT,
    "international" BOOLEAN NOT NULL,
    "typeRecepice" TEXT,
    "recepice" TEXT,
    "groupes" INTEGER,
    "adherents" INTEGER,
    "hommes" INTEGER,
    "femmes" INTEGER,
    "salaries" INTEGER,
    "benevoles" INTEGER,
    "cotisationMensuelle" DOUBLE PRECISION,
    "partenaires" BOOLEAN NOT NULL,
    "but" TEXT,
    "publicCible" TEXT,
    "zones" TEXT[],
    "responsableId" TEXT,
    "activated" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsable" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "age" INTEGER,
    "nationalite" TEXT,
    "situation" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "pieceIdentite" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Responsable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domaine" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domaine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "organisationId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" "ActionType" NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "abreviation" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrganisationDomaines" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrganisationDomaines_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrganisationDepartements" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrganisationDepartements_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_email_key" ON "PasswordReset"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_email_code_key" ON "PasswordReset"("email", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Responsable_nom_key" ON "Responsable"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Domaine_nom_key" ON "Domaine"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Province_nom_key" ON "Province"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Province_abreviation_key" ON "Province"("abreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Departement_nom_provinceId_key" ON "Departement"("nom", "provinceId");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- CreateIndex
CREATE INDEX "_OrganisationDomaines_B_index" ON "_OrganisationDomaines"("B");

-- CreateIndex
CREATE INDEX "_OrganisationDepartements_B_index" ON "_OrganisationDepartements"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Responsable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganisationDomaines" ADD CONSTRAINT "_OrganisationDomaines_A_fkey" FOREIGN KEY ("A") REFERENCES "Domaine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganisationDomaines" ADD CONSTRAINT "_OrganisationDomaines_B_fkey" FOREIGN KEY ("B") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganisationDepartements" ADD CONSTRAINT "_OrganisationDepartements_A_fkey" FOREIGN KEY ("A") REFERENCES "Departement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganisationDepartements" ADD CONSTRAINT "_OrganisationDepartements_B_fkey" FOREIGN KEY ("B") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
