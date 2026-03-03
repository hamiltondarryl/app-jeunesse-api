import { Injectable } from '@nestjs/common';
import { CreateDomaineDto } from './dto/create-domaine.dto';
import { UpdateDomaineDto } from './dto/update-domaine.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationException } from 'src/validator-app/validation.exception';
import { Prisma } from 'src/generated/prisma/client';


@Injectable()
export class DomaineService {
  constructor(
    private prismaService: PrismaService,
  ) { }
  // this.domaineRepository = this.domaineRepository;
  async create(createDomaineDto: CreateDomaineDto) {

    try {

      const existing = await this.prismaService.domaine.findUnique({ where: { nom: createDomaineDto.name } });

      if (existing) {
        throw new ValidationException({
          name: ["Ce domaine existe déjà"],
        });
      }

      const domaine = await this.prismaService.domaine.create({
        data: {
          nom: createDomaineDto.name,
        }
      })
      return { message: "Domaine Créée avec succes" }
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const domaines = await this.prismaService.domaine.findMany({});

      return domaines;
    } catch (error) {
      throw error;
    }
  }


  // Rechercher  avec filtre
  async search(page: number = 1, limit: number = 10, searchQuery: string = '') {
    try {
      const where = searchQuery
        ? {
          OR: [
            {
              nom: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive
              },
            },
          ],
        }
        : {}; // Si pas de query, on ne filtre rien

      const items = await this.prismaService.domaine.findMany({
        where,  // Filtre selon la recherche
        skip: (page - 1) * limit,  // Pagination
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
        // Limite du nombre d'éléments par page
      });

      const total = await this.prismaService.domaine.count({
        where,  // Compte les éléments selon le filtre
      });

      return {
        data: items,
        total: total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };

    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const domaine = await this.prismaService.domaine.findUnique({
        where: { id },
      });

      return domaine;
    } catch (error) {
      throw error;
    }
  }


  async update(id: string, updateDomaineDto: UpdateDomaineDto) {
    try {

      const domaine = await this.prismaService.domaine.update({
        where: { id },
        data: {
          nom: updateDomaineDto.name,
        }
      })
      return { message: "Domaine modifiée avec succes" }

    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const domaine = await this.prismaService.domaine.delete({
        where: { id },
      });

      return { message: "Domaine supprimée avec succes" }

    } catch (error) {
      throw error;
    }
  }
}
  