import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { CreateOrganisationDto } from './dto/create-organisation.dto';

@Injectable()
export class OrganisationService {

  constructor(private readonly prismaService: PrismaService) { }

  // Dans organisation.service.ts
  async create(createOrganisationDto: CreateOrganisationDto, files: any) {
    console.log('📥 Données reçues:', createOrganisationDto);
    console.log('📁 Fichiers reçus:', {
      recepice: files.recepice?.[0]?.originalname,
      pieceIdentite: files.pieceIdentite?.[0]?.originalname
    });

    const recepicePath = files.recepice[0].path;
    const pieceIdentitePath = files.pieceIdentite[0].path;

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
        await this.cleanupFiles([recepicePath, pieceIdentitePath]);
        throw new ConflictException('Une organisation avec ce nom ou sigle existe déjà');
      }

      // Vérifier si le responsable existe déjà (par email)
      if (createOrganisationDto.responsable.email) {
        const existingResponsable = await this.prismaService.responsable.findFirst({
          where: { email: createOrganisationDto.responsable.email },
        });

        if (existingResponsable) {
          await this.cleanupFiles([recepicePath, pieceIdentitePath]);
          throw new ConflictException('Un responsable avec cet email existe déjà');
        }
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
        salaries: createOrganisationDto.salaries ? parseInt(createOrganisationDto.salaries.toString()) : undefined,
        benevoles: createOrganisationDto.benevoles ? parseInt(createOrganisationDto.benevoles.toString()) : undefined,
        cotisationMensuelle: createOrganisationDto.cotisationMensuelle ? parseFloat(createOrganisationDto.cotisationMensuelle.toString()) : undefined,
      };

      console.log('🔄 Données traitées:', processedData);

      return await this.prismaService.$transaction(async (tx) => {
        // Créer le responsable
        const responsable = await tx.responsable.create({
          data: {
            ...processedData.responsable,
            pieceIdentite: pieceIdentitePath,
          },
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
            recepice: recepicePath,
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
            domaines: {
              connect: processedData.domaines.map(id => ({ id })),
            },
            departements: {
              connect: processedData.departements.map(id => ({ id })),
            },
          },
          include: {
            responsable: true,
            domaines: true,
            departements: true,
          },
        });

        console.log('✅ Organisation créée:', organisation);
        return organisation;
      });
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      await this.cleanupFiles([recepicePath, pieceIdentitePath]);

      if (error.code === 'P2002') {
        throw new ConflictException('Violation de contrainte unique');
      } else if (error.code === 'P2025') {
        throw new BadRequestException('Domaine ou département introuvable');
      }

      throw new InternalServerErrorException("Erreur lors de la création de l'organisation: " + error.message);
    }
  }

  private async cleanupFiles(filePaths: string[]) {
    const fs = require('fs').promises;
    for (const filePath of filePaths) {
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Erreur suppression fichier ${filePath}:`, error);
        }
      }
    }
  }
  async findAll() {
    try {
      return await this.prismaService.organisation.findMany({
        include: {
          departements: true,
          responsable: true,
          domaines: true
        }
      })
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération des organisations');
    }
  }

  async search(page: number = 1, limit: number = 10, searchQuery: string = '') {
    try {
      const skip = (page - 1) * limit;
      const where = searchQuery
        ? {
          OR: [
            { nom: { contains: searchQuery, mode: 'insensitive' as Prisma.QueryMode } },
            { sigle: { contains: searchQuery, mode: 'insensitive' as Prisma.QueryMode } },
            { commune: { contains: searchQuery, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        }
        : {};

      const [items, total] = await Promise.all([
        this.prismaService.organisation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.getIncludeRelations(),
        }),
        this.prismaService.organisation.count({ where }),
      ]);

      return {
        data: items,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {

      console.log(error);

      throw new InternalServerErrorException('Erreur lors de la recherche des organisations');
    }
  }

  async findByDomaineId(domaineId: string) {
    try {
      return await this.prismaService.organisation.findMany({
        where: {
          domaines: {
            some: { id: domaineId },
          },
        },
        include: this.getIncludeRelations(),
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération par domaine');
    }
  }

  async findByProvinceId(provinceAbreviation: string) {
    try {
      return await this.prismaService.organisation.findMany({
        where: {
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
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération par province');
    }
  }

  async findOne(id: string) {
    try {
      const organisation = await this.prismaService.organisation.findUnique({
        where: { id },
        include: this.getIncludeRelations(),
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

  async update(id: string, updateOrganisationDto: UpdateOrganisationDto) {
    try {
      const organisation = await this.findOne(id);

      // Implémentez la logique de mise à jour ici
      // ...

      return await this.getById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la mise à jour de l\'organisation');
    }
  }

  async getById(id: string) {
    return await 'ok';
  }

  async remove(id: string) {
    try {
      const organisation = await this.findOne(id);

      await this.prismaService.organisation.delete({
        where: { id },
      });

      return { message: 'Organisation supprimée avec succès' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la suppression de l\'organisation');
    }
  }

  private getIncludeRelations() {
    return {
      responsable: true,
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
      const organisationWhere = domaineId ? {
        domaines: {
          some: {
            id: domaineId
          }
        }
      } : {};

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
                where: organisationWhere
              }
            }
          },
          // Ajouter TOUTES les informations des organisations
          organisations: {
            where: organisationWhere,
            include: {
              // Inclure toutes les relations de l'organisation
              responsable: true,
              domaines: true,
              departements: {
                include: {
                  province: true
                }
              }
              // Tous les champs de l'organisation sont inclus par défaut
            }
          }
        },
        orderBy: {
          nom: 'asc'
        }
      });

      // Formater la réponse avec toutes les informations des organisations
      const formattedResult = result.map(departement => ({
        departementId: departement.id,
        departementNom: departement.nom,
        provinceNom: departement.province.nom,
        provinceAbreviation: departement.province.abreviation,
        nombreOrganisations: departement._count.organisations,
        // Ajouter la liste COMPLÈTE des organisations
        organisations: departement.organisations.map(org => ({
          // Tous les champs de base de l'organisation
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
          recepice: org.recepice,
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
          activated: org.activated,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,

          // Responsable complet
          responsable: org.responsable ? {
            id: org.responsable.id,
            nom: org.responsable.nom,
            age: org.responsable.age,
            nationalite: org.responsable.nationalite,
            situation: org.responsable.situation,
            telephone: org.responsable.telephone,
            email: org.responsable.email,
            adresse: org.responsable.adresse,
            pieceIdentite: org.responsable.pieceIdentite,
            createdAt: org.responsable.createdAt,
            updatedAt: org.responsable.updatedAt
          } : null,

          // Domaines complets
          domaines: org.domaines.map(domaine => ({
            id: domaine.id,
            nom: domaine.nom,
            createdAt: domaine.createdAt,
            updatedAt: domaine.updatedAt
          })),

          // Départements complets avec provinces
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
      console.error('Erreur lors du comptage des organisations par département:', error);
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
      const organisationWhere = domaineId ? {
        domaines: {
          some: {
            id: domaineId
          }
        }
      } : {};

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
                where: organisationWhere
              }
            }
          },
          // Ajouter TOUTES les informations des organisations
          organisations: {
            where: organisationWhere,
            include: {
              // Inclure toutes les relations de l'organisation
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

      // Formater la réponse avec toutes les informations des organisations
      const formattedResult = result.map(departement => ({
        departementId: departement.id,
        departementNom: departement.nom,
        provinceNom: departement.province.nom,
        provinceAbreviation: departement.province.abreviation,
        nombreOrganisations: departement._count.organisations,
        // Ajouter la liste COMPLÈTE des organisations
        organisations: departement.organisations.map(org => ({
          // Tous les champs de base de l'organisation
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
          recepice: org.recepice,
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
          activated: org.activated,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,

          // Responsable complet
          responsable: org.responsable ? {
            id: org.responsable.id,
            nom: org.responsable.nom,
            age: org.responsable.age,
            nationalite: org.responsable.nationalite,
            situation: org.responsable.situation,
            telephone: org.responsable.telephone,
            email: org.responsable.email,
            adresse: org.responsable.adresse,
            pieceIdentite: org.responsable.pieceIdentite,
            createdAt: org.responsable.createdAt,
            updatedAt: org.responsable.updatedAt
          } : null,

          // Domaines complets
          domaines: org.domaines.map(domaine => ({
            id: domaine.id,
            nom: domaine.nom,
            createdAt: domaine.createdAt,
            updatedAt: domaine.updatedAt
          })),

          // Départements complets avec provinces
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
      console.error('Erreur lors de la recherche des organisations par département:', error);
      throw new InternalServerErrorException('Erreur lors de la recherche des organisations');
    }
  }

async getOrganisationsCountByProvince(domaineId?: string) {
  try {
    const organisationWhere = domaineId ? {
      domaines: {
        some: {
          id: domaineId
        }
      }
    } : {};

    // REQUÊTE OPTIMISÉE : Compter directement les organisations uniques par province
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
                  where: organisationWhere
                }
              }
            },
            // Pour le compte exact par province, on récupère les IDs
            organisations: {
              where: organisationWhere,
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
      // Calcul du nombre EXACT d'organisations uniques dans la province
      const tousIdsOrganisations = province.departements.flatMap(
        dept => dept.organisations.map(org => org.id)
      );
      const idsUniques = [...new Set(tousIdsOrganisations)];
      const nombreExact = idsUniques.length;

      return {
        provinceId: province.id,
        provinceNom: province.nom,
        provinceAbreviation: province.abreviation,
        nombreOrganisations: nombreExact, // ◀◀◀ NOMBRE EXACT
        nombreDepartements: province.departements.length,
        departements: province.departements.map(dept => ({
          departementId: dept.id,
          departementNom: dept.nom,
          nombreOrganisations: dept._count.organisations // Présences dans le département
        }))
      };
    });

    const totalOrganisationsExact = formattedResult.reduce((sum, item) => sum + item.nombreOrganisations, 0);

    return {
      domaineId: domaineId || null,
      totalOrganisations: totalOrganisationsExact, // ◀◀◀ TOTAL EXACT
      totalProvinces: formattedResult.length,
      provinces: formattedResult
    };
  } catch (error) {
    console.error('Erreur lors du comptage des organisations par province:', error);
    throw new InternalServerErrorException('Erreur lors de la récupération des statistiques par province');
  }
}
}
