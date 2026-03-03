import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ValidationException } from 'src/validator-app/validation.exception';

@Injectable()
export class PermissionService {
  constructor(
    private readonly prismaService: PrismaService) { }

  // Créer une permission
  async create(createPermissionDto: CreatePermissionDto) {
    const existingName = await this.prismaService.permission.findUnique({ where: { name: createPermissionDto.name } });
    if (existingName) {
      throw new ValidationException({
        name: ['Cette permission existe déjà'],
      });
    }

    await this.prismaService.permission.create({
      data: createPermissionDto
    })

    return { message: "Permission créée avec succes" }
  }

  // Lister les permissions
  async findAll() {
    const permissions = await this.prismaService.permission.findMany({});
    return permissions;
  }

  // Rechercher des permissions
  async search(page: number = 1, limit: number = 10, searchQuery: string = '') {

    try {
      const where = searchQuery
        ? {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive
              },
            },
            {
              description: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive
              }
            } // 'insensitive' pour rendre la recherche insensible à la casse
          ],
        }
        : {}; // Si pas de query, on ne filtre rien

      const permissions = await this.prismaService.permission.findMany({
        where,  // Filtre selon la recherche
        skip: (page - 1) * limit,  // Pagination
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
        // Limite du nombre d'éléments par page
      });

      const total = await this.prismaService.permission.count({
        where,  // Compte les éléments selon le filtre
      });

      return {
        data: permissions,
        total: total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      throw error;
    }

  }

  // Afficher une permission
  async findOne(id: string) {
    try {
      const existinPermission = await this.prismaService.permission.findUnique({ where: { id } });
      if (!existinPermission){
        throw new ValidationException({
          name: ["Cette permission  n'existe pas"],
        });
      } 

      return existinPermission;

    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour une permission
  async update(id: string, updatePermissionDto: UpdatePermissionDto) {

    try {
      const existinService = await this.findOne(id);
      const existingName = await this.prismaService.permission.findUnique({ where: { name: updatePermissionDto.name } });
      if (existingName){
        throw new ValidationException({
          name: ["Cette permission existe déjà"]
        });
      } 

      await this.prismaService.permission.update({
        where: { id },
        data: updatePermissionDto
      })

      return { message: "Permission a été mise à jour" };
    } catch (error) {
      throw error;
    }

  }

  // Supprimer une permission
  async remove(id: string) {
    try {
      const existingPermission = await this.prismaService.permission.findUnique({ where: { id } });
      if (!existingPermission) throw new NotFoundException("Cette permission n'existe déjà");

      await this.prismaService.permission.delete({
        where: { id }
      })

      return { message: "Permission supprimée avec succes" }

    } catch (error) {
      throw error;
    }
  }
}
