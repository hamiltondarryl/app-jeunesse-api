import { PrismaClient } from '../../src/generated/prisma/client';

export const REFERENTIELS = [
  { categorie: 'TYPE_ORGANISATION', code: 'Association', libelle: 'Association', ordre: 1 },
  { categorie: 'TYPE_ORGANISATION', code: 'ONG', libelle: 'ONG', ordre: 2 },
  { categorie: 'TYPE_ORGANISATION', code: 'Coopérative', libelle: 'Coopérative', ordre: 3 },
  { categorie: 'TYPE_ORGANISATION', code: 'Autre', libelle: 'Autre', ordre: 4 },
  { categorie: 'SITUATION_PROFESSIONNELLE', code: 'Etudiant', libelle: 'Étudiant', ordre: 1 },
  { categorie: 'SITUATION_PROFESSIONNELLE', code: 'Salarie', libelle: 'Salarié', ordre: 2 },
  { categorie: 'SITUATION_PROFESSIONNELLE', code: 'Independant', libelle: 'Indépendant', ordre: 3 },
  { categorie: 'SITUATION_PROFESSIONNELLE', code: 'Sans-emploi', libelle: 'Sans emploi', ordre: 4 },
  { categorie: 'SITUATION_PROFESSIONNELLE', code: 'Retraite', libelle: 'Retraité', ordre: 5 },
  { categorie: 'SITUATION_MATRIMONIALE', code: 'Célibataire', libelle: 'Célibataire', ordre: 1 },
  { categorie: 'SITUATION_MATRIMONIALE', code: 'Marié(e)', libelle: 'Marié(e)', ordre: 2 },
  { categorie: 'SITUATION_MATRIMONIALE', code: 'Divorcé(e)', libelle: 'Divorcé(e)', ordre: 3 },
  { categorie: 'SITUATION_MATRIMONIALE', code: 'Veuf(ve)', libelle: 'Veuf(ve)', ordre: 4 },
  { categorie: 'PUBLIC_CIBLE', code: '[15 ; 35[', libelle: '15 à 35 ans', ordre: 1 },
  { categorie: 'PUBLIC_CIBLE', code: '[15 ; 25[', libelle: '15 à 25 ans', ordre: 2 },
  { categorie: 'PUBLIC_CIBLE', code: '[25 ; 35[', libelle: '25 à 35 ans', ordre: 3 },
  { categorie: 'PUBLIC_CIBLE', code: '[15 ; 40[', libelle: '15 à 40 ans', ordre: 4 },
  { categorie: 'PUBLIC_CIBLE', code: '[15 ; 60[', libelle: '15 à 60 ans', ordre: 5 },
  { categorie: 'PUBLIC_CIBLE', code: 'Tous âges', libelle: 'Tous âges', ordre: 6 },
];

export async function seedReferentiels(prisma: PrismaClient) {
  for (const item of REFERENTIELS) {
    await prisma.referentiel.upsert({
      where: {
        categorie_code: {
          categorie: item.categorie,
          code: item.code,
        },
      },
      update: {
        libelle: item.libelle,
        ordre: item.ordre,
        actif: true,
      },
      create: item,
    });
  }
}
