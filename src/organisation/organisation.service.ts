import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { ResponsableDto } from './dto/responsable.dto';
import { toPublicOrganisation, toPublicOrganisationList } from './organisation.mapper';
import { MailService } from 'src/mail/mail.service';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { ActionType } from 'src/generated/prisma/client';

export type OfficerRole = 'responsable' | 'secretaireGeneral' | 'tresorier';
export type DocumentKey =
  | 'recepice'
  | 'recepiceProvisoirOuDefinitif'
  | 'pieceIdentiteResponsable'
  | 'pieceIdentiteSecretaireGeneral'
  | 'pieceIdentiteTresorier';

@Injectable()
export class OrganisationService {
  private readonly logger = new Logger(OrganisationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async create(createOrganisationDto: CreateOrganisationDto, files: any) {
    const recepicePath = files.recepice?.[0]?.path ?? null;
    const pieceIdentiteResponsablePath = files.pieceIdentiteResponsable?.[0]?.path;
    const pieceIdentiteSecretaireGeneralPath = files.pieceIdentiteSecretaireGeneral?.[0]?.path;
    const pieceIdentiteTresorierPath = files.pieceIdentiteTresorier?.[0]?.path;
    const recepiceProvisoirOuDefinitifPath = files.recepiceProvisoirOuDefinitif?.[0]?.path;

    if (!Array.isArray(createOrganisationDto.domaines) || createOrganisationDto.domaines.length === 0) {
      throw new BadRequestException('Au moins un domaine d’intervention est requis');
    }
    if (!Array.isArray(createOrganisationDto.departements) || createOrganisationDto.departements.length === 0) {
      throw new BadRequestException('Au moins un département d’intervention est requis');
    }

    try {
      // Vérifier si l'organisation existe déjà
      const existingOrg = await this.prismaService.organisation.findFirst({
        where: {
          OR: [
            { nom: createOrganisationDto.nom },
            ...(createOrganisationDto.sigle ? [{ sigle: createOrganisationDto.sigle }] : []),
          ],
        },
      });

      if (existingOrg) {
        await this.cleanupFiles([
          recepicePath,
          pieceIdentiteResponsablePath,
          pieceIdentiteSecretaireGeneralPath,
          pieceIdentiteTresorierPath,
          recepiceProvisoirOuDefinitifPath,
        ]);
        throw new ConflictException('Une organisation avec ce nom ou ce sigle existe déjà');
      }

      // Convertir les types si nécessaire
      const processedData = {
        ...createOrganisationDto,
        agrementTechniqueDelivred: createOrganisationDto.agrementTechniqueDelivred === true || createOrganisationDto.agrementTechniqueDelivred === 'true',
        anneeCreation: createOrganisationDto.anneeCreation ? parseInt(createOrganisationDto.anneeCreation.toString()) : undefined,
        groupes: createOrganisationDto.groupes ? parseInt(createOrganisationDto.groupes.toString()) : undefined,
        adherents: createOrganisationDto.adherents ? parseInt(createOrganisationDto.adherents.toString()) : undefined,
        hommes: createOrganisationDto.hommes ? parseInt(createOrganisationDto.hommes.toString()) : undefined,
        femmes: createOrganisationDto.femmes ? parseInt(createOrganisationDto.femmes.toString()) : undefined,
        rib : createOrganisationDto.rib ? createOrganisationDto.rib.toString() : undefined,
        salaries: createOrganisationDto.salaries ? parseInt(createOrganisationDto.salaries.toString()) : undefined,
        benevoles: createOrganisationDto.benevoles ? parseInt(createOrganisationDto.benevoles.toString()) : undefined,
        cotisationMensuelle: createOrganisationDto.cotisationMensuelle ? parseFloat(createOrganisationDto.cotisationMensuelle.toString()) : undefined,
      };

      return await this.prismaService.$transaction(async (tx) => {


        const responsable = await tx.responsable.create({
          data: this.toResponsableCreateData(processedData.responsable, pieceIdentiteResponsablePath),
        });

        const secretaireGeneral = await tx.responsable.create({
          data: this.toResponsableCreateData(processedData.secretaireGeneral, pieceIdentiteSecretaireGeneralPath),
        });

        const tresorier = await tx.responsable.create({
          data: this.toResponsableCreateData(processedData.tresorier, pieceIdentiteTresorierPath),
        });

        // Créer l'organisation
        const organisation = await tx.organisation.create({
          data: {
            nom: processedData.nom,
            sigle: processedData.sigle,
            type: processedData.type,
            anneeCreation: processedData.anneeCreation,
            agrementTechniqueDelivred: processedData.agrementTechniqueDelivred,
            adresse: processedData.adresse,
            commune: processedData.commune,
            international: processedData.international,
            typeRecepice: processedData.typeRecepice,
            recepiceProvisoirOuDefinitif: recepiceProvisoirOuDefinitifPath,
            rib : processedData.rib,
            recepice: recepicePath !=null ? recepicePath : null,
            groupes: processedData.groupes,
            adherents: processedData.adherents,
            hommes: processedData.hommes,
            femmes: processedData.femmes,
            salaries: processedData.salaries,
            benevoles: processedData.benevoles,
            cotisationMensuelle: processedData.cotisationMensuelle,
            partenaires: processedData.partenaires, // Maintenant c'est un string
            but: processedData.but,
            publicCible: processedData.publicCible,
            responsableId: responsable.id,
            secretaireGeneralId: secretaireGeneral.id,
            tresorierId: tresorier.id,
            domaines: {
              connect: (processedData.domaines || []).map((id) => ({ id })),
            },
            departements: {
              connect: (processedData.departements || []).map((id) => ({ id })),
            },
          },
          include: {
            responsable: true,
            secretaireGeneral: true,
            tresorier: true,
            domaines: true,
            departements: true,
          },
        });

        return organisation;
      }).then(async (organisation) => {
        void this.mailService.sendInscriptionReceived(organisation);
        await this.activityLogService.create(
          ActionType.ORGANISATION_CREATED,
          `Inscription déposée pour « ${organisation.nom} »`,
          null,
          { organisationId: organisation.id },
        );
        return organisation;
      });
    } catch (error) {
      await this.cleanupFiles([recepicePath, pieceIdentiteResponsablePath, pieceIdentiteSecretaireGeneralPath, pieceIdentiteTresorierPath, recepiceProvisoirOuDefinitifPath]);

      if (error instanceof HttpException) {
        throw error;
      }
      if ((error as any).code === 'P2002') {
        throw new ConflictException('Violation de contrainte unique');
      } else if ((error as any).code === 'P2025') {
        throw new BadRequestException('Domaine ou département introuvable');
      }

      throw new InternalServerErrorException("Erreur lors de la création de l'organisation: " + (error as any).message);
    }
  }

  private async cleanupFiles(filePaths: string[]) {
    const fs = require('fs').promises;
    for (const filePath of filePaths) {
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          this.logger.error(`Erreur suppression fichier ${filePath}`);
        }
      }
    }
  }
  async findAll() {
    return this.findAllPublic();
  }

  async findAllPublic() {
    try {
      const items = await this.prismaService.organisation.findMany({
        where: { activated: true },
        include: {
          departements: { include: { province: true } },
          responsable: true,
          domaines: true,
        },
        orderBy: { nom: 'asc' },
      });
      return toPublicOrganisationList(items);
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération des organisations');
    }
  }

  private buildSearchWhere(
    searchQuery: string,
    options: { activated?: string; validated?: string; publicView?: boolean } = {},
  ) {
    const query = (searchQuery || '').trim();
    const where: Prisma.OrganisationWhereInput = {};

    if (options.publicView) {
      where.activated = true;
    } else if (options.validated === 'true' || options.validated === 'false') {
      where.validated = options.validated === 'true';
    } else if (options.activated === 'true' || options.activated === 'false') {
      where.activated = options.activated === 'true';
    }

    if (query) {
      where.OR = [
        { nom: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { sigle: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { commune: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { but: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { type: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { adresse: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { responsable: { nom: { contains: query, mode: 'insensitive' as Prisma.QueryMode } } },
        { domaines: { some: { nom: { contains: query, mode: 'insensitive' as Prisma.QueryMode } } } },
        { departements: { some: { nom: { contains: query, mode: 'insensitive' as Prisma.QueryMode } } } },
        {
          departements: {
            some: {
              province: { nom: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
            },
          },
        },
      ];
    }

    return where;
  }

  async search(
    page: number = 1,
    limit: number = 10,
    activated?: string,
    searchQuery: string = '',
    publicView = false,
    validated?: string,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 10;
      const skip = (safePage - 1) * safeLimit;
      const where = this.buildSearchWhere(searchQuery, {
        publicView,
        activated: publicView ? 'true' : activated,
        validated: publicView ? undefined : validated,
      });

      const [items, total] = await Promise.all([
        this.prismaService.organisation.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { createdAt: 'desc' },
          include: this.getIncludeRelations(),
        }),
        this.prismaService.organisation.count({ where }),
      ]);

      return {
        data: publicView ? toPublicOrganisationList(items) : items,
        total,
        page: safePage,
        limit: safeLimit,
        lastPage: Math.ceil(total / safeLimit) || 1,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la recherche des organisations');
    }
  }

  async searchPublicText(query: string, domaineId?: string) {
    const searchTerm = (query || '').trim();
    if (searchTerm.length < 2) {
      throw new BadRequestException('Saisissez au moins 2 caractères pour rechercher');
    }

    const organisations = await this.prismaService.organisation.findMany({
      where: {
        activated: true,
        ...(domaineId
          ? {
              domaines: { some: { id: domaineId } },
            }
          : {}),
        OR: [
          { nom: { contains: searchTerm, mode: 'insensitive' } },
          { sigle: { contains: searchTerm, mode: 'insensitive' } },
          { commune: { contains: searchTerm, mode: 'insensitive' } },
          { but: { contains: searchTerm, mode: 'insensitive' } },
          { type: { contains: searchTerm, mode: 'insensitive' } },
          { responsable: { nom: { contains: searchTerm, mode: 'insensitive' } } },
          { domaines: { some: { nom: { contains: searchTerm, mode: 'insensitive' } } } },
          { departements: { some: { nom: { contains: searchTerm, mode: 'insensitive' } } } },
          {
            departements: {
              some: {
                province: { nom: { contains: searchTerm, mode: 'insensitive' } },
              },
            },
          },
        ],
      },
      include: this.getIncludeRelations(),
      orderBy: { nom: 'asc' },
      take: 50,
    });

    return {
      searchTerm,
      totalOrganisations: organisations.length,
      organisations: toPublicOrganisationList(organisations),
    };
  }

  async suggestPublic(query: string) {
    const searchTerm = (query || '').trim();
    if (searchTerm.length < 2) {
      return [];
    }

    return this.prismaService.organisation.findMany({
      where: {
        activated: true,
        OR: [
          { nom: { contains: searchTerm, mode: 'insensitive' } },
          { sigle: { contains: searchTerm, mode: 'insensitive' } },
          { commune: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        nom: true,
        sigle: true,
        commune: true,
        type: true,
      },
      orderBy: { nom: 'asc' },
      take: 8,
    });
  }

  async findByDomaineId(domaineId: string, publicView = false) {
    try {
      const items = await this.prismaService.organisation.findMany({
        where: {
          ...(publicView ? { activated: true } : {}),
          domaines: {
            some: { id: domaineId },
          },
        },
        include: this.getIncludeRelations(),
      });
      return publicView ? toPublicOrganisationList(items) : items;
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération par domaine');
    }
  }

  async findByProvinceId(provinceAbreviation: string, publicView = false) {
    try {
      const items = await this.prismaService.organisation.findMany({
        where: {
          ...(publicView ? { activated: true } : {}),
          departements: {
            some: {
              province: {
                abreviation: provinceAbreviation,
              },
            },
          },
        },
        include: this.getIncludeRelations(),
      });
      return publicView ? toPublicOrganisationList(items) : items;
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération par province');
    }
  }

  async findOne(id: string, publicView = false) {
    try {
      const organisation = await this.prismaService.organisation.findUnique({
        where: { id },
        include: this.getIncludeRelations(),
      });

      if (!organisation || (publicView && !organisation.activated)) {
        throw new NotFoundException('Organisation non trouvée');
      }

      return publicView ? toPublicOrganisation(organisation) : organisation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Erreur lors de la récupération de l'organisation");
    }
  }

  // Remplacez la méthode update par celle-ci :

async update(id: string, updateOrganisationDto: UpdateOrganisationDto, actorId?: string) {
  try {
    // Vérifier si l'organisation existe
    const existingOrganisation = await this.prismaService.organisation.findUnique({
      where: { id },
      include: {
        responsable: true,
        secretaireGeneral: true,
        tresorier: true
      }
    });

    if (!existingOrganisation) {
      throw new NotFoundException('Organisation non trouvée');
    }

    // Préparer les données pour la mise à jour
    const {
      responsable,
      secretaireGeneral,
      tresorier,
      domaines,
      departements,
      ...organisationData
    } = updateOrganisationDto;

    // Utiliser une transaction pour mettre à jour toutes les données
    return await this.prismaService.$transaction(async (tx) => {
      
      // 1. Mettre à jour l'organisation
      const updatedOrganisation = await tx.organisation.update({
        where: { id },
        data: {
          nom: organisationData.nom,
          sigle: organisationData.sigle,
          type: organisationData.type,
          anneeCreation: this.toOptionalInt(organisationData.anneeCreation),
          agrementTechniqueDelivred: organisationData.agrementTechniqueDelivred === true || organisationData.agrementTechniqueDelivred === 'true',
          adresse: organisationData.adresse,
          commune: organisationData.commune,
          international: organisationData.international === true || organisationData.international?.toString() === 'true',
          rib: organisationData.rib,
          partenaires: organisationData.partenaires,
          but: organisationData.but,
          publicCible: organisationData.publicCible,
          groupes: this.toOptionalInt(organisationData.groupes),
          adherents: this.toOptionalInt(organisationData.adherents),
          hommes: this.toOptionalInt(organisationData.hommes),
          femmes: this.toOptionalInt(organisationData.femmes),
          salaries: this.toOptionalInt(organisationData.salaries),
          benevoles: this.toOptionalInt(organisationData.benevoles),
          cotisationMensuelle: this.toOptionalFloat(organisationData.cotisationMensuelle),
        },
      });

      await this.upsertOfficer(tx, id, existingOrganisation.responsableId, 'responsableId', responsable);
      await this.upsertOfficer(tx, id, existingOrganisation.secretaireGeneralId, 'secretaireGeneralId', secretaireGeneral);
      await this.upsertOfficer(tx, id, existingOrganisation.tresorierId, 'tresorierId', tresorier);

      // 5. Mettre à jour les relations (domaines et départements)
      if (domaines && domaines.length > 0) {
        await tx.organisation.update({
          where: { id },
          data: {
            domaines: {
              set: domaines.map(domaineId => ({ id: domaineId })),
            },
          },
        });
      }

      if (departements && departements.length > 0) {
        await tx.organisation.update({
          where: { id },
          data: {
            departements: {
              set: departements.map(departementId => ({ id: departementId })),
            },
          },
        });
      }

      const result = await this.getById(id);
      await this.activityLogService.create(
        ActionType.ORGANISATION_UPDATED,
        `Dossier de « ${result.nom} » mis à jour`,
        actorId,
        { organisationId: id },
      );
      return result;
    });
  } catch (error) {
    this.logger.error('Erreur lors de la mise à jour');
    if (error instanceof HttpException) {
      throw error;
    }
    if (error instanceof Object && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Un conflit de données unique est survenu');
    }
    throw new InternalServerErrorException('Erreur lors de la mise à jour de l’organisation');
  }
}



  async getById(id: string) {
  try {
    const organisation = await this.prismaService.organisation.findUnique({
      where: { id },
      include: {
        responsable: true,
        secretaireGeneral: true,
        tresorier: true,
        domaines: true,
        departements: {
          include: { province: true }
        },
      },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation non trouvée');
    }

    return organisation;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException('Erreur lors de la récupération de l\'organisation');
  }
}

  async remove(id: string, actorId?: string) {
    try {
      const organisation = await this.prismaService.organisation.findUnique({
        where: { id },
        select: {
          nom: true,
          responsableId: true,
          secretaireGeneralId: true,
          tresorierId: true,
        },
      });
      if (!organisation) {
        throw new NotFoundException('Organisation non trouvée');
      }

      await this.activityLogService.create(
        ActionType.OTHER,
        `Association « ${organisation.nom} » supprimée`,
        actorId,
      );

      await this.prismaService.organisation.delete({ where: { id } });
      await this.deleteOrphanOfficers([
        organisation.responsableId,
        organisation.secretaireGeneralId,
        organisation.tresorierId,
      ]);

      return { message: 'Organisation supprimée avec succès' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la suppression de l\'organisation');
    }
  }

  private async deleteOrphanOfficers(ids: Array<string | null | undefined>) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    for (const officerId of uniqueIds) {
      const stillLinked = await this.prismaService.organisation.count({
        where: {
          OR: [
            { responsableId: officerId },
            { secretaireGeneralId: officerId },
            { tresorierId: officerId },
          ],
        },
      });
      if (!stillLinked) {
        await this.prismaService.responsable.delete({ where: { id: officerId } }).catch(() => undefined);
      }
    }
  }

  async getActivity(id: string) {
    await this.getById(id);
    return this.activityLogService.organisationLog(id);
  }

  async validateOrganisation(id: string, actorId: string, commentaire?: string) {
    const organisation = await this.prismaService.organisation.findUnique({ where: { id } });
    if (!organisation) {
      throw new NotFoundException('Organisation non trouvée');
    }
    if (organisation.validated) {
      throw new BadRequestException('Cette inscription a déjà été validée');
    }

    const updatedOrganisation = await this.prismaService.organisation.update({
      where: { id },
      data: { validated: true, activated: true },
      include: this.getIncludeRelations(),
    });

    await this.activityLogService.create(
      ActionType.ORGANISATION_VALIDATED,
      `Inscription de « ${updatedOrganisation.nom} » validée et publiée`,
      actorId,
      { organisationId: id, comment: commentaire },
    );
    void this.mailService.sendAssociationValidated(updatedOrganisation);

    return {
      ...updatedOrganisation,
      message: 'Association validée et désormais visible au public',
    };
  }

  async publishOrganisation(id: string, actorId: string, commentaire: string) {
    const organisation = await this.requireOrganisation(id);
    if (!organisation.validated) {
      throw new BadRequestException('Validez d’abord l’inscription avant de la rendre visible');
    }
    if (organisation.activated) {
      throw new BadRequestException('Cette association est déjà visible');
    }

    const updatedOrganisation = await this.prismaService.organisation.update({
      where: { id },
      data: { activated: true },
      include: this.getIncludeRelations(),
    });

    await this.activityLogService.create(
      ActionType.ORGANISATION_PUBLISHED,
      `« ${updatedOrganisation.nom} » remise en visibilité publique`,
      actorId,
      { organisationId: id, comment: commentaire },
    );

    return {
      ...updatedOrganisation,
      message: 'Association désormais visible au public',
    };
  }

  async unpublishOrganisation(id: string, actorId: string, commentaire: string) {
    const organisation = await this.requireOrganisation(id);
    if (!organisation.activated) {
      throw new BadRequestException('Cette association n’est déjà plus visible');
    }

    const updatedOrganisation = await this.prismaService.organisation.update({
      where: { id },
      data: { activated: false },
      include: this.getIncludeRelations(),
    });

    await this.activityLogService.create(
      ActionType.ORGANISATION_UNPUBLISHED,
      `« ${updatedOrganisation.nom} » retirée de la visibilité publique`,
      actorId,
      { organisationId: id, comment: commentaire },
    );

    return {
      ...updatedOrganisation,
      message: 'Association retirée de la carte publique',
    };
  }

  async activeOrganisation(id: string, activated?: boolean, actorId?: string, commentaire?: string) {
    const organisation = await this.requireOrganisation(id);
    const nextStatus = typeof activated === 'boolean' ? activated : !organisation.activated;
    if (!organisation.validated && nextStatus) {
      return this.validateOrganisation(id, actorId || '', commentaire);
    }
    if (nextStatus) {
      return this.publishOrganisation(id, actorId || '', commentaire || 'Remise en visibilité');
    }
    return this.unpublishOrganisation(id, actorId || '', commentaire || 'Retrait de visibilité');
  }

  private async requireOrganisation(id: string) {
    const organisation = await this.prismaService.organisation.findUnique({ where: { id } });
    if (!organisation) {
      throw new NotFoundException('Organisation non trouvée');
    }
    return organisation;
  }

  private getIncludeRelations() {
    return {
      responsable: true,
      tresorier: true,
      secretaireGeneral: true,
      domaines: true,
      departements: { include: { province: true } },
    };
  }

  async getOrganisationsCountByDepartement(provinceAbreviation: string, domaineId?: string) {
  try {
    // Construire le where conditionnel pour les départements
    const departementWhere = {
      province: {
        abreviation: provinceAbreviation
      }
    };

    // Construire le where conditionnel pour les organisations
    // AJOUTER activated: true
    const organisationWhere = {
      activated: true, // ◀◀◀ AJOUTER CETTE LIGNE
      ...(domaineId ? {
        domaines: {
          some: {
            id: domaineId
          }
        }
      } : {})
    };

    const result = await this.prismaService.departement.findMany({
      where: departementWhere,
      include: {
        province: {
          select: {
            nom: true,
            abreviation: true
          }
        },
        _count: {
          select: {
            organisations: {
              where: organisationWhere // Utiliser le nouveau where
            }
          }
        },
        organisations: {
          where: organisationWhere, // Utiliser le nouveau where
          include: {
            responsable: true,
            domaines: true,
            departements: {
              include: {
                province: true
              }
            }
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Le reste du code reste identique...
    // Formater la réponse avec toutes les informations des organisations
    const formattedResult = result.map(departement => ({
      departementId: departement.id,
      departementNom: departement.nom,
      provinceNom: departement.province.nom,
      provinceAbreviation: departement.province.abreviation,
      nombreOrganisations: departement._count.organisations,
      organisations: departement.organisations.map(org => ({
        id: org.id,
        nom: org.nom,
        sigle: org.sigle,
        type: org.type,
        anneeCreation: org.anneeCreation,
        agrementTechniqueDelivred: org.agrementTechniqueDelivred,
        adresse: org.adresse,
        commune: org.commune,
        international: org.international,
        typeRecepice: org.typeRecepice,
        groupes: org.groupes,
        adherents: org.adherents,
        hommes: org.hommes,
        femmes: org.femmes,
        salaries: org.salaries,
        benevoles: org.benevoles,
        cotisationMensuelle: org.cotisationMensuelle,
        partenaires: org.partenaires,
        but: org.but,
        publicCible: org.publicCible,
        activated: org.activated, // Ce sera toujours true maintenant
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,

        responsable: org.responsable ? {
          id: org.responsable.id,
          nom: org.responsable.nom,
          age: org.responsable.age,
          nationalite: org.responsable.nationalite,
          situation: org.responsable.situation,
          telephone: org.responsable.telephone,
          email: org.responsable.email,
          adresse: org.responsable.adresse,
          createdAt: org.responsable.createdAt,
          updatedAt: org.responsable.updatedAt
        } : null,

        domaines: org.domaines.map(domaine => ({
          id: domaine.id,
          nom: domaine.nom,
          createdAt: domaine.createdAt,
          updatedAt: domaine.updatedAt
        })),

        departements: org.departements.map(dept => ({
          id: dept.id,
          nom: dept.nom,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
          province: {
            id: dept.province.id,
            nom: dept.province.nom,
            abreviation: dept.province.abreviation,
            createdAt: dept.province.createdAt,
            updatedAt: dept.province.updatedAt
          }
        }))
      }))
    }));

    const totalOrganisations = formattedResult.reduce((sum, item) => sum + item.nombreOrganisations, 0);

    return {
      province: provinceAbreviation,
      domaineId: domaineId || null,
      totalOrganisations: totalOrganisations,
      departements: formattedResult
    };
  } catch (error) {
    this.logger.error('Erreur lors du comptage des organisations par département');
    throw new InternalServerErrorException('Erreur lors de la récupération des statistiques');
  }
}

  async searchOrganisationsByDepartement(searchTerm: string, domaineId?: string) {
  try {
    // Construire le where conditionnel pour les départements avec recherche textuelle
    const departementWhere = {
      OR: [
        {
          nom: {
            contains: searchTerm,
            mode: 'insensitive' as const
          }
        },
        {
          province: {
            nom: {
              contains: searchTerm,
              mode: 'insensitive' as const
            }
          }
        },
        {
          province: {
            abreviation: {
              contains: searchTerm,
              mode: 'insensitive' as const
            }
          }
        }
      ]
    };

    // Construire le where conditionnel pour les organisations
    // AJOUTER activated: true
    const organisationWhere = {
      activated: true, // ◀◀◀ AJOUTER CETTE LIGNE
      ...(domaineId ? {
        domaines: {
          some: {
            id: domaineId
          }
        }
      } : {})
    };

    const result = await this.prismaService.departement.findMany({
      where: departementWhere,
      include: {
        province: {
          select: {
            nom: true,
            abreviation: true
          }
        },
        _count: {
          select: {
            organisations: {
              where: organisationWhere // Utiliser le nouveau where
            }
          }
        },
        organisations: {
          where: organisationWhere, // Utiliser le nouveau where
          include: {
            responsable: true,
            domaines: true,
            departements: {
              include: {
                province: true
              }
            }
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Le reste du code reste identique...
    const formattedResult = result.map(departement => ({
      departementId: departement.id,
      departementNom: departement.nom,
      provinceNom: departement.province.nom,
      provinceAbreviation: departement.province.abreviation,
      nombreOrganisations: departement._count.organisations,
      organisations: departement.organisations.map(org => ({
        id: org.id,
        nom: org.nom,
        sigle: org.sigle,
        type: org.type,
        anneeCreation: org.anneeCreation,
        agrementTechniqueDelivred: org.agrementTechniqueDelivred,
        adresse: org.adresse,
        commune: org.commune,
        international: org.international,
        typeRecepice: org.typeRecepice,
        groupes: org.groupes,
        adherents: org.adherents,
        hommes: org.hommes,
        femmes: org.femmes,
        salaries: org.salaries,
        benevoles: org.benevoles,
        cotisationMensuelle: org.cotisationMensuelle,
        partenaires: org.partenaires,
        but: org.but,
        publicCible: org.publicCible,
        activated: org.activated, // Toujours true
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,

        responsable: org.responsable ? {
          id: org.responsable.id,
          nom: org.responsable.nom,
          age: org.responsable.age,
          nationalite: org.responsable.nationalite,
          situation: org.responsable.situation,
          telephone: org.responsable.telephone,
          email: org.responsable.email,
          adresse: org.responsable.adresse,
          createdAt: org.responsable.createdAt,
          updatedAt: org.responsable.updatedAt
        } : null,

        domaines: org.domaines.map(domaine => ({
          id: domaine.id,
          nom: domaine.nom,
          createdAt: domaine.createdAt,
          updatedAt: domaine.updatedAt
        })),

        departements: org.departements.map(dept => ({
          id: dept.id,
          nom: dept.nom,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
          province: {
            id: dept.province.id,
            nom: dept.province.nom,
            abreviation: dept.province.abreviation,
            createdAt: dept.province.createdAt,
            updatedAt: dept.province.updatedAt
          }
        }))
      }))
    }));

    const totalOrganisations = formattedResult.reduce((sum, item) => sum + item.nombreOrganisations, 0);

    return {
      searchTerm: searchTerm,
      domaineId: domaineId || null,
      totalOrganisations: totalOrganisations,
      totalDepartements: formattedResult.length,
      departements: formattedResult
    };
  } catch (error) {
    this.logger.error('Erreur lors de la recherche des organisations par département');
    throw new InternalServerErrorException('Erreur lors de la recherche des organisations');
  }
}

async getOrganisationsCountByProvince(domaineId?: string) {
  try {
    // AJOUTER activated: true
    const organisationWhere = {
      activated: true, // ◀◀◀ AJOUTER CETTE LIGNE
      ...(domaineId ? {
        domaines: {
          some: {
            id: domaineId
          }
        }
      } : {})
    };

    const provinces = await this.prismaService.province.findMany({
      select: {
        id: true,
        nom: true,
        abreviation: true,
        departements: {
          select: {
            id: true,
            nom: true,
            _count: {
              select: {
                organisations: {
                  where: organisationWhere // Utiliser le nouveau where
                }
              }
            },
            organisations: {
              where: organisationWhere, // Utiliser le nouveau where
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    const formattedResult = provinces.map(province => {
      const tousIdsOrganisations = province.departements.flatMap(
        dept => dept.organisations.map(org => org.id)
      );
      const idsUniques = [...new Set(tousIdsOrganisations)];
      const nombreExact = idsUniques.length;

      return {
        provinceId: province.id,
        provinceNom: province.nom,
        provinceAbreviation: province.abreviation,
        nombreOrganisations: nombreExact,
        nombreDepartements: province.departements.length,
        departements: province.departements.map(dept => ({
          departementId: dept.id,
          departementNom: dept.nom,
          nombreOrganisations: dept._count.organisations
        }))
      };
    });

    const totalOrganisationsExact = formattedResult.reduce((sum, item) => sum + item.nombreOrganisations, 0);

    return {
      domaineId: domaineId || null,
      totalOrganisations: totalOrganisationsExact,
      totalProvinces: formattedResult.length,
      provinces: formattedResult
    };
  } catch (error) {
    this.logger.error('Erreur lors du comptage des organisations par province');
    throw new InternalServerErrorException('Erreur lors de la récupération des statistiques par province');
  }
}

  private toResponsableCreateData(
    person?: {
      nom?: string;
      age?: number;
      nationalite?: string;
      situation?: string;
      situationMatrimoniale?: string;
      telephone?: string;
      email?: string;
      adresse?: string;
    },
    pieceIdentite?: string,
  ) {
    return {
      nom: person?.nom?.trim() || 'À compléter',
      age: this.toOptionalInt(person?.age),
      nationalite: person?.nationalite || undefined,
      situation: person?.situation || undefined,
      situationMatrimoniale: person?.situationMatrimoniale || undefined,
      telephone: person?.telephone || undefined,
      email: person?.email || undefined,
      adresse: person?.adresse || undefined,
      pieceIdentite: pieceIdentite || undefined,
    };
  }

  private toOptionalInt(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private toOptionalFloat(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = parseFloat(String(value));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  async updateOfficer(id: string, role: OfficerRole, person: ResponsableDto, actorId?: string) {
    const organisation = await this.prismaService.organisation.findUnique({
      where: { id },
      include: this.getIncludeRelations(),
    });
    if (!organisation) {
      throw new NotFoundException('Organisation non trouvée');
    }

    const relationField = this.officerRelationField(role);
    const existingId = organisation[relationField];

    await this.prismaService.$transaction(async (tx) => {
      await this.upsertOfficer(tx, id, existingId, relationField, person);
    });

    const labels = {
      responsable: 'président',
      secretaireGeneral: 'secrétaire général',
      tresorier: 'trésorier',
    };
    const result = await this.getById(id);
    await this.activityLogService.create(
      ActionType.ORGANISATION_OFFICER_UPDATED,
      `Bureau mis à jour (${labels[role]}) pour « ${result.nom} »`,
      actorId,
      { organisationId: id },
    );
    return result;
  }

  async updateDocuments(
    id: string,
    files: {
      recepice?: Express.Multer.File[];
      recepiceProvisoirOuDefinitif?: Express.Multer.File[];
      pieceIdentiteResponsable?: Express.Multer.File[];
      pieceIdentiteSecretaireGeneral?: Express.Multer.File[];
      pieceIdentiteTresorier?: Express.Multer.File[];
    },
    remove: DocumentKey[] = [],
    actorId?: string,
  ) {
    const organisation = await this.prismaService.organisation.findUnique({
      where: { id },
      include: this.getIncludeRelations(),
    });
    if (!organisation) {
      throw new NotFoundException('Organisation non trouvée');
    }

    const toDelete: string[] = [];

    const nextOrg: Prisma.OrganisationUpdateInput = {};
    if (remove.includes('recepice')) {
      if (organisation.recepice) toDelete.push(organisation.recepice);
      nextOrg.recepice = null;
    }
    if (remove.includes('recepiceProvisoirOuDefinitif')) {
      if (organisation.recepiceProvisoirOuDefinitif) {
        toDelete.push(organisation.recepiceProvisoirOuDefinitif);
      }
      nextOrg.recepiceProvisoirOuDefinitif = null;
    }
    if (files.recepice?.[0]) {
      if (organisation.recepice) toDelete.push(organisation.recepice);
      nextOrg.recepice = files.recepice[0].path;
    }
    if (files.recepiceProvisoirOuDefinitif?.[0]) {
      if (organisation.recepiceProvisoirOuDefinitif) {
        toDelete.push(organisation.recepiceProvisoirOuDefinitif);
      }
      nextOrg.recepiceProvisoirOuDefinitif = files.recepiceProvisoirOuDefinitif[0].path;
    }

    if (Object.keys(nextOrg).length) {
      await this.prismaService.organisation.update({
        where: { id },
        data: nextOrg,
      });
    }

    await this.replaceOfficerDocument(
      organisation,
      'responsable',
      files.pieceIdentiteResponsable?.[0]?.path,
      remove.includes('pieceIdentiteResponsable'),
      toDelete,
    );
    await this.replaceOfficerDocument(
      organisation,
      'secretaireGeneral',
      files.pieceIdentiteSecretaireGeneral?.[0]?.path,
      remove.includes('pieceIdentiteSecretaireGeneral'),
      toDelete,
    );
    await this.replaceOfficerDocument(
      organisation,
      'tresorier',
      files.pieceIdentiteTresorier?.[0]?.path,
      remove.includes('pieceIdentiteTresorier'),
      toDelete,
    );

    await this.cleanupFiles(toDelete);
    const result = await this.getById(id);
    await this.activityLogService.create(
      ActionType.ORGANISATION_DOCUMENTS_UPDATED,
      `Documents mis à jour pour « ${result.nom} »`,
      actorId,
      { organisationId: id },
    );
    return result;
  }

  private officerRelationField(role: OfficerRole): 'responsableId' | 'secretaireGeneralId' | 'tresorierId' {
    if (role === 'responsable') return 'responsableId';
    if (role === 'secretaireGeneral') return 'secretaireGeneralId';
    return 'tresorierId';
  }

  private async replaceOfficerDocument(
    organisation: {
      id: string;
      responsableId?: string | null;
      secretaireGeneralId?: string | null;
      tresorierId?: string | null;
      responsable?: { id: string; pieceIdentite?: string | null } | null;
      secretaireGeneral?: { id: string; pieceIdentite?: string | null } | null;
      tresorier?: { id: string; pieceIdentite?: string | null } | null;
    },
    role: OfficerRole,
    nextPath?: string,
    remove = false,
    toDelete: string[] = [],
  ) {
    if (!nextPath && !remove) {
      return;
    }

    const officer = organisation[role];
    if (officer?.pieceIdentite) {
      toDelete.push(officer.pieceIdentite);
    }

    if (officer) {
      await this.prismaService.responsable.update({
        where: { id: officer.id },
        data: { pieceIdentite: nextPath || null },
      });
      return;
    }

    if (!nextPath) {
      return;
    }

    const created = await this.prismaService.responsable.create({
      data: { nom: 'À compléter', pieceIdentite: nextPath },
    });
    await this.prismaService.organisation.update({
      where: { id: organisation.id },
      data: { [this.officerRelationField(role)]: created.id },
    });
  }

  private async upsertOfficer(
    tx: Prisma.TransactionClient,
    organisationId: string,
    existingId: string | null | undefined,
    relationField: 'responsableId' | 'secretaireGeneralId' | 'tresorierId',
    person?: {
      nom?: string;
      age?: number;
      nationalite?: string;
      situation?: string;
      situationMatrimoniale?: string;
      telephone?: string;
      email?: string;
      adresse?: string;
    },
  ) {
    if (!person) {
      return;
    }

    const data = {
      nom: person.nom?.trim() || undefined,
      age: this.toOptionalInt(person.age),
      nationalite: person.nationalite || undefined,
      situation: person.situation || undefined,
      situationMatrimoniale: person.situationMatrimoniale || undefined,
      telephone: person.telephone || undefined,
      email: person.email || undefined,
      adresse: person.adresse || undefined,
    };

    if (existingId) {
      await tx.responsable.update({
        where: { id: existingId },
        data,
      });
      return;
    }

    const hasIdentity = Boolean(data.nom || data.telephone || data.email);
    if (!hasIdentity) {
      return;
    }

    const created = await tx.responsable.create({
      data: { ...data, nom: data.nom || 'À compléter' },
    });
    await tx.organisation.update({
      where: { id: organisationId },
      data: { [relationField]: created.id },
    });
  }
}
