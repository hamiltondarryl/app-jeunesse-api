import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as XLSX from 'xlsx';

type Periode = { debut?: Date; fin?: Date };

@Injectable()
export class DashbordService {
  constructor(private prismaService: PrismaService) {}

  async findAll(debut?: string, fin?: string) {
    try {
      const periode = this.parsePeriode(debut, fin);
      const createdAt = this.createdAtFilter(periode);

      const [users, referentiels, organisations, provinces] = await Promise.all([
        this.prismaService.user.count({ where: { activated: true } }),
        this.prismaService.referentiel.findMany({
          where: { actif: true },
          select: { categorie: true, code: true, libelle: true },
        }),
        this.prismaService.organisation.findMany({
          where: createdAt ? { createdAt } : {},
          include: {
            domaines: { select: { nom: true } },
            departements: { include: { province: { select: { nom: true, abreviation: true } } } },
          },
        }),
        this.prismaService.province.findMany({
          orderBy: { nom: 'asc' },
          select: { nom: true, abreviation: true },
        }),
      ]);

      const labels = this.buildLabels(referentiels);
      const publiees = organisations.filter((item) => item.activated);
      const enAttente = organisations.filter((item) => !item.activated);

      const totalAdherents = this.sum(publiees, 'adherents');
      const totalHommes = this.sum(publiees, 'hommes');
      const totalFemmes = this.sum(publiees, 'femmes');
      const totalSalaries = this.sum(publiees, 'salaries');
      const totalBenevoles = this.sum(publiees, 'benevoles');
      const cotisations = publiees
        .map((item) => item.cotisationMensuelle || 0)
        .filter((value) => value > 0);
      const cotisationMoyenne = cotisations.length
        ? Math.round(cotisations.reduce((sum, value) => sum + value, 0) / cotisations.length)
        : 0;

      const parProvince = this.aggregateProvinces(organisations, provinces);
      const parType = this.aggregateCount(
        organisations,
        (item) => labels.types[item.type || ''] || item.type || 'Non renseigné',
      );
      const parDomaine = this.aggregateDomaines(organisations);
      const parPublicCible = this.aggregateCount(
        organisations,
        (item) => labels.publics[item.publicCible || ''] || item.publicCible || 'Non renseigné',
      );
      const parStatut = [
        { nom: 'Publiées', total: publiees.length },
        { nom: 'En attente de validation', total: enAttente.length },
      ];
      const parSexe = [
        { nom: 'Hommes', total: totalHommes },
        { nom: 'Femmes', total: totalFemmes },
      ];
      const inscriptionsParMois = this.aggregateMonths(organisations, periode);

      const bullesProvince = parProvince.map((item) => ({
        nom: item.nom,
        abreviation: item.abreviation,
        associations: item.total,
        adherents: item.adherents,
        cotisation: item.cotisation,
      }));

      const bullesDomaine = parDomaine.map((item) => ({
        nom: item.nom,
        associations: item.total,
        adherents: item.adherents,
        cotisation: item.cotisation,
      }));

      return {
        periode: {
          debut: (periode.debut || this.firstDate(organisations))?.toISOString().slice(0, 10) || null,
          fin: (periode.fin || new Date()).toISOString().slice(0, 10),
        },
        associationsPubliees: publiees.length,
        dossiersEnAttente: enAttente.length,
        utilisateursActifs: users,
        associationCountActivated: publiees.length,
        associationCountDeactivated: enAttente.length,
        userCount: users,
        totalAdherents,
        totalHommes,
        totalFemmes,
        totalSalaries,
        totalBenevoles,
        cotisationMoyenne,
        associationsSansRib: publiees.filter((item) => !item.rib).length,
        associationsSansAgrement: publiees.filter((item) => !item.agrementTechniqueDelivred).length,
        parProvince,
        parType,
        parDomaine,
        parPublicCible,
        parStatut,
        parSexe,
        inscriptionsParMois,
        bullesProvince,
        bullesDomaine,
        aidesDecision: this.buildAides({
          publiees,
          enAttente,
          parProvince,
          parDomaine,
          cotisationMoyenne,
          totalAdherents,
          totalSalaries,
          totalBenevoles,
        }),
      };
    } catch {
      throw new InternalServerErrorException('Impossible de charger le tableau de bord');
    }
  }

  async exportExcel(debut?: string, fin?: string): Promise<Buffer> {
    const data = await this.findAll(debut, fin);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Tableau de bord — Associations de jeunesse'],
        ['Période', `${data.periode.debut || 'Début'} → ${data.periode.fin}`],
        [],
        ['Indicateur', 'Valeur'],
        ['Associations publiées', data.associationsPubliees],
        ['Inscriptions en attente', data.dossiersEnAttente],
        ['Adhérents', data.totalAdherents],
        ['Hommes', data.totalHommes],
        ['Femmes', data.totalFemmes],
        ['Salariés', data.totalSalaries],
        ['Bénévoles', data.totalBenevoles],
        ['Cotisation moyenne (FCFA)', data.cotisationMoyenne],
        ['Associations sans RIB', data.associationsSansRib],
        ['Associations sans agrément technique', data.associationsSansAgrement],
      ]),
      'Synthèse',
    );

    this.appendSheet(workbook, 'Provinces', ['Province', 'Associations', 'Adhérents', 'Cotisation moyenne'], data.parProvince.map((item) => [item.nom, item.total, item.adherents, item.cotisation]));
    this.appendSheet(workbook, 'Types', ['Type', 'Total'], data.parType.map((item) => [item.nom || item.type, item.total]));
    this.appendSheet(workbook, 'Domaines', ['Domaine', 'Associations', 'Adhérents'], data.parDomaine.map((item) => [item.nom, item.total, item.adherents]));
    this.appendSheet(workbook, 'Public cible', ['Public', 'Total'], data.parPublicCible.map((item) => [item.nom, item.total]));
    this.appendSheet(
      workbook,
      'Aide à la décision',
      ['Volet', 'Priorité', 'Indicateur', 'Valeur', 'Recommandation'],
      data.aidesDecision.map((item) => [item.volet, item.priorite, item.titre, item.valeur, item.recommandation]),
    );

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private appendSheet(workbook: XLSX.WorkBook, name: string, headers: string[], rows: Array<Array<string | number>>) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, ...rows]), name);
  }

  private parsePeriode(debut?: string, fin?: string): Periode {
    return {
      debut: debut ? new Date(`${debut}T00:00:00`) : undefined,
      fin: fin ? new Date(`${fin}T23:59:59`) : undefined,
    };
  }

  private createdAtFilter(periode: Periode) {
    if (!periode.debut && !periode.fin) {
      return undefined;
    }
    return {
      ...(periode.debut ? { gte: periode.debut } : {}),
      ...(periode.fin ? { lte: periode.fin } : {}),
    };
  }

  private firstDate(organisations: Array<{ createdAt: Date }>) {
    if (!organisations.length) {
      return undefined;
    }
    return organisations.reduce((min, item) => (item.createdAt < min ? item.createdAt : min), organisations[0].createdAt);
  }

  private buildLabels(referentiels: Array<{ categorie: string; code: string; libelle: string }>) {
    const types: Record<string, string> = {};
    const publics: Record<string, string> = {};
    for (const item of referentiels) {
      if (item.categorie === 'TYPE_ORGANISATION') {
        types[item.code] = item.libelle;
      }
      if (item.categorie === 'PUBLIC_CIBLE') {
        publics[item.code] = item.libelle;
      }
    }
    return { types, publics };
  }

  private sum(items: Array<Record<string, any>>, field: string): number {
    return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
  }

  private aggregateCount(items: Array<Record<string, any>>, labelOf: (item: Record<string, any>) => string) {
    const map = new Map<string, number>();
    for (const item of items) {
      const label = labelOf(item);
      map.set(label, (map.get(label) || 0) + 1);
    }
    return [...map.entries()]
      .map(([nom, total]) => ({ nom, type: nom, total }))
      .sort((a, b) => b.total - a.total);
  }

  private aggregateDomaines(organisations: Array<{
    activated: boolean;
    adherents: number | null;
    cotisationMensuelle: number | null;
    domaines: Array<{ nom: string }>;
  }>) {
    const map = new Map<string, { total: number; adherents: number; cotisations: number[] }>();
    for (const organisation of organisations) {
      const domaines = organisation.domaines.length ? organisation.domaines : [{ nom: 'Non renseigné' }];
      for (const domaine of domaines) {
        const current = map.get(domaine.nom) || { total: 0, adherents: 0, cotisations: [] };
        current.total += 1;
        current.adherents += organisation.adherents || 0;
        if (organisation.cotisationMensuelle) {
          current.cotisations.push(organisation.cotisationMensuelle);
        }
        map.set(domaine.nom, current);
      }
    }
    return [...map.entries()]
      .map(([nom, value]) => ({
        nom,
        total: value.total,
        adherents: value.adherents,
        cotisation: value.cotisations.length
          ? Math.round(value.cotisations.reduce((sum, item) => sum + item, 0) / value.cotisations.length)
          : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  private aggregateProvinces(
    organisations: Array<{
      adherents: number | null;
      cotisationMensuelle: number | null;
      departements: Array<{ province: { nom: string; abreviation: string } }>;
    }>,
    provinces: Array<{ nom: string; abreviation: string }>,
  ) {
    const map = new Map<string, { nom: string; abreviation: string; ids: Set<number | string>; adherents: number; cotisations: number[] }>();
    for (const province of provinces) {
      map.set(province.nom, {
        nom: province.nom,
        abreviation: province.abreviation,
        ids: new Set(),
        adherents: 0,
        cotisations: [],
      });
    }

    organisations.forEach((organisation, index) => {
      const targets = organisation.departements.length
        ? organisation.departements.map((item) => item.province)
        : [{ nom: 'Non renseigné', abreviation: '—' }];
      const seen = new Set<string>();
      for (const province of targets) {
        if (seen.has(province.nom)) {
          continue;
        }
        seen.add(province.nom);
        const current = map.get(province.nom) || {
          nom: province.nom,
          abreviation: province.abreviation,
          ids: new Set(),
          adherents: 0,
          cotisations: [],
        };
        current.ids.add(index);
        current.adherents += organisation.adherents || 0;
        if (organisation.cotisationMensuelle) {
          current.cotisations.push(organisation.cotisationMensuelle);
        }
        map.set(province.nom, current);
      }
    });

    return [...map.values()]
      .map((item) => ({
        nom: item.nom,
        abreviation: item.abreviation,
        total: item.ids.size,
        adherents: item.adherents,
        cotisation: item.cotisations.length
          ? Math.round(item.cotisations.reduce((sum, value) => sum + value, 0) / item.cotisations.length)
          : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  private aggregateMonths(organisations: Array<{ createdAt: Date }>, periode: Periode) {
    const start = periode.debut || this.firstDate(organisations) || new Date(new Date().getFullYear(), 0, 1);
    const end = periode.fin || new Date();
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    const mois: Array<{ key: string; label: string; total: number }> = [];

    while (cursor <= last && mois.length < 18) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      mois.push({
        key,
        label: cursor.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        total: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const organisation of organisations) {
      const key = `${organisation.createdAt.getFullYear()}-${String(organisation.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = mois.find((item) => item.key === key);
      if (bucket) {
        bucket.total += 1;
      }
    }

    return mois;
  }

  private buildAides(input: {
    publiees: Array<{ rib: string | null; agrementTechniqueDelivred: boolean; adherents: number | null; salaries: number | null }>;
    enAttente: unknown[];
    parProvince: Array<{ nom: string; total: number; adherents: number; cotisation: number }>;
    parDomaine: Array<{ nom: string; total: number; adherents: number }>;
    cotisationMoyenne: number;
    totalAdherents: number;
    totalSalaries: number;
    totalBenevoles: number;
  }) {
    const sansRib = input.publiees.filter((item) => !item.rib).length;
    const sansAgrement = input.publiees.filter((item) => !item.agrementTechniqueDelivred).length;
    const benevolesSeules = input.publiees.filter((item) => (item.adherents || 0) >= 30 && !(item.salaries || 0)).length;
    const provincesVides = input.parProvince.filter((item) => item.nom !== 'Non renseigné' && item.total === 0);
    const provincePrioritaire = [...input.parProvince]
      .filter((item) => item.total > 0)
      .sort((a, b) => a.cotisation - b.cotisation || b.adherents - a.adherents)[0];
    const domaineFaible = [...input.parDomaine].filter((item) => item.nom !== 'Non renseigné').sort((a, b) => a.total - b.total)[0];
    const ratioBenevoles = input.totalSalaries
      ? Math.round(input.totalBenevoles / Math.max(input.totalSalaries, 1))
      : input.totalBenevoles;

    return [
      {
        volet: 'Financement',
        priorite: sansRib ? 'haute' : 'basse',
        titre: 'Associations sans RIB',
        valeur: `${sansRib} / ${input.publiees.length}`,
        recommandation: sansRib
          ? 'Prioriser un appui à l’ouverture de compte pour sécuriser les versements de subvention.'
          : 'Les associations publiées disposent d’un RIB. Les versements peuvent être instruits.',
      },
      {
        volet: 'Financement',
        priorite: sansAgrement ? 'haute' : 'moyenne',
        titre: 'Agrément technique manquant',
        valeur: `${sansAgrement} associations`,
        recommandation: sansAgrement
          ? 'Accompagner la délivrance d’agrément technique avant tout financement public structurant.'
          : 'Le prérequis d’agrément est globalement satisfait.',
      },
      {
        volet: 'Financement',
        priorite: input.cotisationMoyenne < 5000 ? 'haute' : 'moyenne',
        titre: 'Cotisation mensuelle moyenne',
        valeur: `${input.cotisationMoyenne} FCFA`,
        recommandation: input.cotisationMoyenne < 5000
          ? 'Les ressources propres sont faibles : un fonds de fonctionnement ou un appui aux cotisations est pertinent.'
          : 'Les ressources propres sont plus solides. Orienter le financement vers l’investissement et les projets.',
      },
      {
        volet: 'Financement',
        priorite: benevolesSeules ? 'haute' : 'basse',
        titre: 'Associations bénévoles à fort effectif',
        valeur: `${benevolesSeules} associations`,
        recommandation: benevolesSeules
          ? 'Identifier les structures de 30 adhérents et plus sans salarié pour un appui à l’emploi associatif.'
          : 'Peu de structures combinant un fort effectif et l’absence de salarié.',
      },
      {
        volet: 'Activité',
        priorite: domaineFaible && domaineFaible.total <= 2 ? 'haute' : 'moyenne',
        titre: 'Domaine d’intervention le moins couvert',
        valeur: domaineFaible ? `${domaineFaible.nom} (${domaineFaible.total})` : '—',
        recommandation: domaineFaible
          ? `Renforcer les activités et appels à projets sur le domaine « ${domaineFaible.nom} ».`
          : 'Aucun domaine n’est encore renseigné.',
      },
      {
        volet: 'Activité',
        priorite: ratioBenevoles > 10 ? 'moyenne' : 'basse',
        titre: 'Ratio bénévoles / salariés',
        valeur: `${ratioBenevoles} / 1`,
        recommandation: ratioBenevoles > 10
          ? 'Le secteur repose fortement sur le bénévolat. Un appui à l’encadrement salarié sécuriserait les activités.'
          : 'L’encadrement salarié est plus équilibré.',
      },
      {
        volet: 'Couverture',
        priorite: provincesVides.length ? 'haute' : 'basse',
        titre: 'Provinces sans association sur la période',
        valeur: provincesVides.length ? provincesVides.map((item) => item.nom).join(', ') : 'Aucune',
        recommandation: provincesVides.length
          ? 'Organiser une campagne d’information et d’appui à l’inscription dans les provinces non couvertes.'
          : 'Toutes les provinces ont au moins une association sur la période.',
      },
      {
        volet: 'Couverture',
        priorite: input.enAttente.length ? 'moyenne' : 'basse',
        titre: 'Dossiers en instruction',
        valeur: `${input.enAttente.length} inscriptions`,
        recommandation: input.enAttente.length
          ? 'Accélérer la validation pour améliorer la visibilité territoriale et les décisions de financement.'
          : 'Aucun dossier n’est en attente de validation.',
      },
      {
        volet: 'Financement',
        priorite: provincePrioritaire && provincePrioritaire.cotisation < 5000 ? 'moyenne' : 'basse',
        titre: 'Province prioritaire pour un appui',
        valeur: provincePrioritaire
          ? `${provincePrioritaire.nom} — ${provincePrioritaire.adherents} adhérents, cotisation ${provincePrioritaire.cotisation} FCFA`
          : '—',
        recommandation: provincePrioritaire
          ? `Cibler ${provincePrioritaire.nom} pour un financement d’activités : effectif notable et ressources propres limitées.`
          : 'Pas assez de données territoriales pour prioriser.',
      },
      {
        volet: 'Activité',
        priorite: 'basse',
        titre: 'Base d’adhérents publiée',
        valeur: `${input.totalAdherents} jeunes`,
        recommandation: input.totalAdherents
          ? 'Utiliser cet effectif comme cible pour les programmes nationaux de jeunesse et les campagnes de terrain.'
          : 'Compléter les effectifs des associations pour fiabiliser le ciblage.',
      },
    ];
  }
}
