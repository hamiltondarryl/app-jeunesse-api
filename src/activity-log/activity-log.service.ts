import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActionType, LogScope, Prisma } from 'src/generated/prisma/client';

export type ActivityLogExtras = {
  organisationId?: string;
  comment?: string;
  scope?: LogScope;
};

const METIER_ACTIONS = new Set<ActionType>([
  ActionType.ORGANISATION_CREATED,
  ActionType.ORGANISATION_UPDATED,
  ActionType.ORGANISATION_VALIDATED,
  ActionType.ORGANISATION_PUBLISHED,
  ActionType.ORGANISATION_UNPUBLISHED,
  ActionType.ORGANISATION_OFFICER_UPDATED,
  ActionType.ORGANISATION_DOCUMENTS_UPDATED,
]);

const SYSTEME_ACTIONS = new Set<ActionType>([
  ActionType.SYSTEM_BOOT,
  ActionType.SYSTEM_MAIL_SENT,
  ActionType.SYSTEM_MAIL_FAILED,
  ActionType.SYSTEM_ERROR,
]);

const ACTION_LABELS: Record<ActionType, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  OTHER: 'Autre action',
  PASSWORD_RESET: 'Réinitialisation du mot de passe',
  PASSWORD_CHANGE: 'Changement de mot de passe',
  FORGOT_PASSWORD: 'Demande de mot de passe',
  ACCOUNT_CREATED: 'Création de compte',
  ACCOUNT_ACTIVATION: 'Activation de compte',
  ORGANISATION_CREATED: 'Inscription déposée',
  ORGANISATION_UPDATED: 'Dossier modifié',
  ORGANISATION_VALIDATED: 'Inscription validée',
  ORGANISATION_PUBLISHED: 'Mise en visibilité',
  ORGANISATION_UNPUBLISHED: 'Retrait de visibilité',
  ORGANISATION_OFFICER_UPDATED: 'Bureau mis à jour',
  ORGANISATION_DOCUMENTS_UPDATED: 'Documents mis à jour',
  SYSTEM_BOOT: 'Démarrage de l’API',
  SYSTEM_MAIL_SENT: 'E-mail envoyé',
  SYSTEM_MAIL_FAILED: 'Échec d’e-mail',
  SYSTEM_ERROR: 'Erreur système',
};

@Injectable()
export class ActivityLogService {
  constructor(private readonly prismaService: PrismaService) {}

  scopeOf(action: ActionType): LogScope {
    if (METIER_ACTIONS.has(action)) {
      return LogScope.METIER;
    }
    if (SYSTEME_ACTIONS.has(action)) {
      return LogScope.SYSTEME;
    }
    return LogScope.APPLICATION;
  }

  async create(
    action: ActionType,
    description: string,
    userId?: string | null,
    extras?: ActivityLogExtras,
  ) {
    try {
      await this.prismaService.activityLog.create({
        data: {
          scope: extras?.scope || this.scopeOf(action),
          action,
          description,
          comment: extras?.comment || null,
          userId: userId || undefined,
          organisationId: extras?.organisationId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async organisationLog(organisationId: string) {
    const items = await this.prismaService.activityLog.findMany({
      where: { organisationId, scope: LogScope.METIER },
      orderBy: { createdAt: 'desc' },
      include: this.includeAuteur(),
    });
    return items.map((item) => this.toPublic(item));
  }

  async search(params: {
    scopes: LogScope[];
    debut?: string;
    fin?: string;
    q?: string;
    roleCode?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number.isFinite(params.page) && params.page! > 0 ? Number(params.page) : 1;
    const limit = Math.min(50, Number.isFinite(params.limit) && params.limit! > 0 ? Number(params.limit) : 20);
    const createdAt = this.periodFilter(params.debut, params.fin);
    const query = (params.q || '').trim();

    const where: Prisma.ActivityLogWhereInput = {
      scope: { in: params.scopes },
      ...(createdAt ? { createdAt } : {}),
      ...(params.roleCode ? { user: { role: { code: params.roleCode } } } : {}),
      ...(query
        ? {
            OR: [
              { description: { contains: query, mode: 'insensitive' } },
              { comment: { contains: query, mode: 'insensitive' } },
              { user: { username: { contains: query, mode: 'insensitive' } } },
              { user: { email: { contains: query, mode: 'insensitive' } } },
              { organisation: { nom: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prismaService.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: this.includeAuteur(),
      }),
      this.prismaService.activityLog.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toPublic(item)),
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit) || 1,
      periode: {
        debut: params.debut || null,
        fin: params.fin || null,
      },
    };
  }

  async userLog(userId: string) {
    const activityLog = await this.prismaService.activityLog.findMany({
      where: { userId, scope: LogScope.APPLICATION },
      orderBy: { createdAt: 'desc' },
      include: this.includeAuteur(),
    });
    return activityLog.map((item) => this.toPublic(item));
  }

  async allLog() {
    return this.search({ scopes: [LogScope.APPLICATION, LogScope.METIER], limit: 50 });
  }

  private periodFilter(debut?: string, fin?: string): Prisma.DateTimeFilter | undefined {
    if (!debut && !fin) {
      return undefined;
    }
    const filter: Prisma.DateTimeFilter = {};
    if (debut) {
      filter.gte = new Date(`${debut}T00:00:00.000`);
    }
    if (fin) {
      filter.lte = new Date(`${fin}T23:59:59.999`);
    }
    return filter;
  }

  private includeAuteur() {
    return {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: { select: { name: true } },
        },
      },
      organisation: {
        select: { id: true, nom: true, sigle: true },
      },
    };
  }

  private toPublic(item: {
    id: string;
    scope: LogScope;
    action: ActionType;
    description: string | null;
    comment: string | null;
    createdAt: Date;
    user?: { id: string; username: string | null; email: string; role?: { name: string } | null } | null;
    organisation?: { id: string; nom: string; sigle: string | null } | null;
  }) {
    return {
      id: item.id,
      scope: item.scope,
      action: item.action,
      libelle: ACTION_LABELS[item.action] || item.action,
      description: item.description,
      comment: item.comment,
      createdAt: item.createdAt,
      auteur: item.user
        ? {
            id: item.user.id,
            nom: item.user.username || item.user.email,
            email: item.user.email,
            role: item.user.role?.name || null,
          }
        : null,
      organisation: item.organisation
        ? {
            id: item.organisation.id,
            nom: item.organisation.nom,
            sigle: item.organisation.sigle,
          }
        : null,
    };
  }
}
