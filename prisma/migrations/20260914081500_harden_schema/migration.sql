-- Align production schema with prisma/schema.prisma (additive, idempotent).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

DO $$ BEGIN
  CREATE TYPE "LogScope" AS ENUM ('METIER', 'APPLICATION', 'SYSTEME');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_CREATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_UPDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_VALIDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_PUBLISHED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_UNPUBLISHED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_OFFICER_UPDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'ORGANISATION_DOCUMENTS_UPDATED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SYSTEM_BOOT';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SYSTEM_MAIL_SENT';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SYSTEM_MAIL_FAILED';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'SYSTEM_ERROR';

ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "scope" "LogScope" NOT NULL DEFAULT 'APPLICATION';
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "comment" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;

CREATE INDEX IF NOT EXISTS "ActivityLog_scope_createdAt_idx" ON "ActivityLog"("scope", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_organisationId_createdAt_idx" ON "ActivityLog"("organisationId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ActivityLog" DROP CONSTRAINT IF EXISTS "ActivityLog_userId_fkey";
ALTER TABLE "ActivityLog"
  ADD CONSTRAINT "ActivityLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Referentiel" (
  "id" TEXT NOT NULL,
  "categorie" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "libelle" TEXT NOT NULL,
  "ordre" INTEGER NOT NULL DEFAULT 0,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Referentiel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Referentiel_categorie_code_key" ON "Referentiel"("categorie", "code");
CREATE INDEX IF NOT EXISTS "Referentiel_categorie_actif_ordre_idx" ON "Referentiel"("categorie", "actif", "ordre");

ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "activated" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Organisation_validated_activated_idx" ON "Organisation"("validated", "activated");
CREATE INDEX IF NOT EXISTS "Organisation_createdAt_idx" ON "Organisation"("createdAt");
CREATE INDEX IF NOT EXISTS "Organisation_nom_idx" ON "Organisation"("nom");
