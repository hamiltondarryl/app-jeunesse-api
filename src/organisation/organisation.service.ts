import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
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
      pieceIdentiteResponsable: files.pieceIdentiteResponsable?.[0]?.originalname,
      pieceIdentiteSecretaireGeneral : files.pieceIdentiteSecretaireGeneral?.[0]?.originalname,
      pieceIdentiteTresorier : files.pieceIdentiteTresorier?.[0]?.originalname,
      recepiceProvisoirOuDefinitif: files.recepiceProvisoirOuDefinitif?.[0]?.originalname,
    });

    const recepicePath = files.recepice?.[0]?.path ? files.recepice[0].path : null;
    const pieceIdentiteResponsablePath = files.pieceIdentiteResponsable[0].path;
    const pieceIdentiteSecretaireGeneralPath = files.pieceIdentiteSecretaireGeneral[0].path;
    const pieceIdentiteTresorierPath = files.pieceIdentiteTresorier[0].path;
    const recepiceProvisoirOuDefinitifPath = files.recepiceProvisoirOuDefinitif[0].path;

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

      /*if (existingOrg) {
        await this.cleanupFiles([pieceIdentiteResponsablePath, pieceIdentiteSecretaireGeneralPath, pieceIdentiteTresorierPath, recepiceProvisoirOuDefinitifPath]);
        throw new ConflictException('');
      }*/

      // Vérifier si le responsable existe déjà (par email)
   /*   if (createOrganisationDto.responsable.email) {
        const existingResponsable = await this.prismaService.responsable.findFirst({
          where: { email: createOrganisationDto.responsable.email },
        });

        if (existingResponsable) {
          await this.cleanupFiles([pieceIdentiteResponsablePath, pieceIdentiteSecretaireGeneralPath, pieceIdentiteTresorierPath, recepiceProvisoirOuDefinitifPath]);
          throw new ConflictException('Un responsable avec cet email existe déjà');
        }
      }
      
      if (createOrganisationDto.secretaireGeneral.email) {
        const existingSecretaireGeneral = await this.prismaService.responsable.findFirst({
          where: { email: createOrganisationDto.secretaireGeneral.email },
        });

        if (existingSecretaireGeneral) {
          await this.cleanupFiles([ pieceIdentiteResponsablePath, pieceIdentiteSecretaireGeneralPath, pieceIdentiteTresorierPath, recepiceProvisoirOuDefinitifPath]);
          throw new ConflictException('Un secrétaire général avec cet email existe déjà');
        }
      }

      if (createOrganisationDto.tresorier.email) {
        const existingTresorier = await this.prismaService.responsable.findFirst({
          where: { email: createOrganisationDto.tresorier.email },
        });

        if (existingTresorier) {
          await this.cleanupFiles([pieceIdentiteResponsablePath, pieceIdentiteSecretaireGeneralPath, pieceIdentiteTresorierPath, recepiceProvisoirOuDefinitifPath]);
          throw new ConflictException('Un trésorier avec cet email existe déjà');
        }
      }
*/


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

      console.log('🔄 Données traitées:', processedData);

      return await this.prismaService.$transaction(async (tx) => {


        // Créer le responsable
        const responsable = await tx.responsable.create({
          data: {
            ...processedData.responsable,
            pieceIdentite: pieceIdentiteResponsablePath,
          },
        });

        const secretaireGeneral = await tx.responsable.create({
          data: {
            ...processedData.secretaireGeneral,
            pieceIdentite: pieceIdentiteSecretaireGeneralPath,
          },
        });

        const tresorier = await tx.responsable.create({
          data: {
            ...processedData.tresorier,
            pieceIdentite: pieceIdentiteTresorierPath,
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
      await this.cleanupFiles([recepicePath, pieceIdentiteResponsablePath, pieceIdentiteSecretaireGeneralPath, pieceIdentiteTresorierPath, recepiceProvisoirOuDefinitifPath]);

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

  async search(page: number = 1, limit: number = 10, activated : string = "true" ,searchQuery: string = '') {
    try {
      const skip = (page - 1) * limit;
     const where = {
      activated: activated === "true" ? true : false,
      ...(searchQuery
        ? {
            OR: [
              { nom: { contains: searchQuery, mode: 'insensitive' as Prisma.QueryMode } },
              { sigle: { contains: searchQuery, mode: 'insensitive' as Prisma.QueryMode } },
              { commune: { contains: searchQuery, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {})
    };

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

  // Remplacez la méthode update par celle-ci :

async update(id: string, updateOrganisationDto: UpdateOrganisationDto) {
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
          anneeCreation: organisationData.anneeCreation ? parseInt(organisationData.anneeCreation.toString()) : undefined,
          agrementTechniqueDelivred: organisationData.agrementTechniqueDelivred === true || organisationData.agrementTechniqueDelivred === 'true',
          adresse: organisationData.adresse,
          commune: organisationData.commune,
          international: organisationData.international === true || organisationData.international?.toString() === 'true',
          rib: organisationData.rib,
          partenaires: organisationData.partenaires,
          but: organisationData.but,
          publicCible: organisationData.publicCible,
          groupes: organisationData.groupes ? parseInt(organisationData.groupes.toString()) : undefined,
          adherents: organisationData.adherents ? parseInt(organisationData.adherents.toString()) : undefined,
          hommes: organisationData.hommes ? parseInt(organisationData.hommes.toString()) : undefined,
          femmes: organisationData.femmes ? parseInt(organisationData.femmes.toString()) : undefined,
          salaries: organisationData.salaries ? parseInt(organisationData.salaries.toString()) : undefined,
          benevoles: organisationData.benevoles ? parseInt(organisationData.benevoles.toString()) : undefined,
          cotisationMensuelle: organisationData.cotisationMensuelle ? parseFloat(organisationData.cotisationMensuelle.toString()) : undefined,
        },
      });

      // 2. Mettre à jour ou créer le responsable
      if (responsable) {
        if (existingOrganisation.responsableId) {
          await tx.responsable.update({
            where: { id: existingOrganisation.responsableId },
            data: {
              nom: responsable.nom,
              age: responsable.age ? parseInt(responsable.age.toString()) : undefined,
              nationalite: responsable.nationalite,
              situation: responsable.situation,
              situationMatrimoniale: responsable.situationMatrimoniale,
              telephone: responsable.telephone,
              email: responsable.email,
              adresse: responsable.adresse,
            },
          });
        } else {
          const newResponsable = await tx.responsable.create({
            data: {
              nom: responsable.nom,
              age: responsable.age ? parseInt(responsable.age.toString()) : undefined,
              nationalite: responsable.nationalite,
              situation: responsable.situation,
              situationMatrimoniale: responsable.situationMatrimoniale,
              telephone: responsable.telephone,
              email: responsable.email,
              adresse: responsable.adresse,
            },
          });
          await tx.organisation.update({
            where: { id },
            data: { responsableId: newResponsable.id },
          });
        }
      }

      // 3. Mettre à jour ou créer le secrétaire général
      if (secretaireGeneral) {
        if (existingOrganisation.secretaireGeneralId) {
          await tx.responsable.update({
            where: { id: existingOrganisation.secretaireGeneralId },
            data: {
              nom: secretaireGeneral.nom,
              age: secretaireGeneral.age ? parseInt(secretaireGeneral.age.toString()) : undefined,
              nationalite: secretaireGeneral.nationalite,
              situation: secretaireGeneral.situation,
              situationMatrimoniale: secretaireGeneral.situationMatrimoniale,
              telephone: secretaireGeneral.telephone,
              email: secretaireGeneral.email,
              adresse: secretaireGeneral.adresse,
            },
          });
        } else {
          const newSecretaire = await tx.responsable.create({
            data: {
              nom: secretaireGeneral.nom,
              age: secretaireGeneral.age ? parseInt(secretaireGeneral.age.toString()) : undefined,
              nationalite: secretaireGeneral.nationalite,
              situation: secretaireGeneral.situation,
              situationMatrimoniale: secretaireGeneral.situationMatrimoniale,
              telephone: secretaireGeneral.telephone,
              email: secretaireGeneral.email,
              adresse: secretaireGeneral.adresse,
            },
          });
          await tx.organisation.update({
            where: { id },
            data: { secretaireGeneralId: newSecretaire.id },
          });
        }
      }

      // 4. Mettre à jour ou créer le trésorier
      if (tresorier) {
        if (existingOrganisation.tresorierId) {
          await tx.responsable.update({
            where: { id: existingOrganisation.tresorierId },
            data: {
              nom: tresorier.nom,
              age: tresorier.age ? parseInt(tresorier.age.toString()) : undefined,
              nationalite: tresorier.nationalite,
              situation: tresorier.situation,
              situationMatrimoniale: tresorier.situationMatrimoniale,
              telephone: tresorier.telephone,
              email: tresorier.email,
              adresse: tresorier.adresse,
            },
          });
        } else {
          const newTresorier = await tx.responsable.create({
            data: {
              nom: tresorier.nom,
              age: tresorier.age ? parseInt(tresorier.age.toString()) : undefined,
              nationalite: tresorier.nationalite,
              situation: tresorier.situation,
              situationMatrimoniale: tresorier.situationMatrimoniale,
              telephone: tresorier.telephone,
              email: tresorier.email,
              adresse: tresorier.adresse,
            },
          });
          await tx.organisation.update({
            where: { id },
            data: { tresorierId: newTresorier.id },
          });
        }
      }

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

      // Retourner l'organisation mise à jour avec toutes les relations
      return { message: 'Organisation mise à jour avec succès'}
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    if (error instanceof NotFoundException) {
      throw error;
    }
    if (error instanceof Object && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Un conflit de données unique est survenu');
    }
    throw new InternalServerErrorException('Erreur lors de la mise à jour de l\'organisation: ' + (error instanceof Error ? error.message : String(error)));
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

  async activeOrganisation(id: string) {
    try {
      const organisation = await this.prismaService.organisation.findUnique({
        where: { id },
      });

      if (!organisation) {
        throw new NotFoundException('Organisation non trouvée');
      }

      const updatedOrganisation = await this.prismaService.organisation.update({
        where: { id },
        data: { activated: organisation.activated ? false : true },
      });

      return updatedOrganisation;
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de l\'activation de l\'organisation');
    }
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
          pieceIdentite: org.responsable.pieceIdentite,
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
          pieceIdentite: org.responsable.pieceIdentite,
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
    console.error('Erreur lors de la recherche des organisations par département:', error);
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
    console.error('Erreur lors du comptage des organisations par province:', error);
    throw new InternalServerErrorException('Erreur lors de la récupération des statistiques par province');
  }
}
}
