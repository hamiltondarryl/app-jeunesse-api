import { Injectable } from '@nestjs/common';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganisationService {
  constructor(
    private prismaService: PrismaService,

  ) { }
  create(createOrganisationDto: CreateOrganisationDto) {
    return 'This action adds a new organisation';
  }

  async findAll() {
    try {
      const organisations = await this.prismaService.organisation.findMany({
        include: {
          responsable: true,
          domaines: true,
          contacts: true,
          provinces: true,
        },
      });

      return organisations;

    } catch (error) {
      throw error;
    }
  }
  // Rechercher  avec filtre
  async search(page: number = 1, limit: number = 10, searchQuery: string = '') {
    const where = searchQuery
      ? {
        OR: [
          {
            nom: {
              contains: searchQuery,
              mode: Prisma.QueryMode.insensitive
            },
          },
          {
            sigle: {
              contains: searchQuery,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            commune: {
              contains: searchQuery,
              mode: Prisma.QueryMode.insensitive
            }
          },
          // 'insensitive' pour rendre la recherche insensible à la casse
        ],
      }
      : {}; // Si pas de query, on ne filtre rien

    const items = await this.prismaService.organisation.findMany({
      where,  // Filtre selon la recherche
      skip: (page - 1) * limit,  // Pagination
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
      // Limite du nombre d'éléments par page
    });

    const total = await this.prismaService.organisation.count({
      where,  // Compte les éléments selon le filtre
    });

    return {
      data: items,
      total: total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findByDomaineId(domaineId: string) {
    try {
      const organisations = this.prismaService.organisation.findMany({
        where: {
          domaines: {
            some: {
              id: domaineId,
            },
          },
        },
        include: {
          responsable: true,
          domaines: true,
          contacts: true,
          provinces: true,
        },
      });

      return organisations;

    } catch (error) {
      throw error;
    }
  }

  async findByProvinceId(provinceAbreviation: string) {
    try {
      const organisations = this.prismaService.organisation.findMany({
        where: {
          provinces: {
            some: {
              anbreviation: provinceAbreviation,
            },
          },
        },
        include: {
          responsable: true,
          domaines: true,
          contacts: true,
          provinces: true,
        },
      });

      return organisations;

    } catch (error) {
      throw error;
    }

  }

  findOne(id: string) {
    try {
      const organisation = this.prismaService.organisation.findUnique({
        where: {
          id
        },
        include: {
          responsable: true,
          domaines: true,
          contacts: true,
          provinces: true,
        },
      });

      return organisation;

    } catch (error) {
      throw error;
    }
  }

  update(id: number, updateOrganisationDto: UpdateOrganisationDto) {
    return `This action updates a #${id} organisation`;
  }

  remove(id: number) {
    return `This action removes a #${id} organisation`;
  }
}
