import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ValidationException } from 'src/validator-app/validation.exception';

@Injectable()
export class RoleService {

  constructor(private readonly prismaService: PrismaService) { }

  async create(createRoleDto: CreateRoleDto) {

    try {
      const { name, code, description, permissions } = createRoleDto;

      // Vérification si un rôle avec le même nom existe déjà
      const existingRole = await this.prismaService.role.findFirst({
        where: { name },
      });

      if (existingRole) {
        throw new ValidationException({
          name: ['Ce rôle  existe déjà.'],
        });
      }

      // Vérification si un rôle avec le même code existe déjà
      const existingCode = await this.prismaService.role.findFirst({
        where: { code },
      });

      if (existingCode) {
        throw new ValidationException({
          code: ['Ce code existe déjà.'],
        });
      }

      // Vérification si les permissions existent
      const validPermissions = await this.prismaService.permission.findMany({
        where: { id: { in: permissions } },
      });

      if (validPermissions.length !== permissions.length) {
        throw new ValidationException({
          permissions: ['Certaines permissions fournies sont introuvables.'],
        });
      }

      // Création du rôle avec les permissions associées
      await this.prismaService.role.create({
        data: {
          name,
          code,
          description,
          permissions: {
            connect: validPermissions.map((permission) => ({ id: permission.id })),
          },
        },
      });

      return { message: "Role créée avec succès" }
    } catch (error) {
      throw error;
    }
  }

  // Lister les roles 
  async findAll() {
    try {
      const roles = this.prismaService.role.findMany({
        include: {
          permissions: true
        }
      })
      return roles;
    } catch (error) {
      throw error;
    }
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
              code: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive
              }
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

      const roles = await this.prismaService.role.findMany({
        where,  // Filtre selon la recherche
        skip: (page - 1) * limit,  // Pagination
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          permissions: true
        }
        // Limite du nombre d'éléments par page
      });

      const total = await this.prismaService.role.count({
        where,  // Compte les éléments selon le filtre
      });

      return {
        data: roles,
        total: total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  // Recuperer un role
  findOne(id: string) {
    return `This action returns a #${id} role`;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const { name, code, description, permissions } = updateRoleDto;

      // Vérification si le rôle existe
      const existingRole = await this.prismaService.role.findUnique({ where: { id } });
      if (!existingRole) {
        throw new ValidationException({
          name: ['Role introuvables.'],
        });
      }

      // Vérification si le nom ou le code est déjà utilisé par un autre rôle
      if (name || code) {
        const conflictingRole = await this.prismaService.role.findFirst({
          where: {
            AND: [
              { id: { not: id } }, // Exclure le rôle actuel
              {
                OR: [
                  { name: name || undefined },
                  { code: code || undefined },
                ],
              },
            ],
          },
        });

        if (conflictingRole) {
          throw new ValidationException({
            name: ['Un autre rôle avec ce nom ou code existe déjà.'],
          });
        }
      }

      // Vérification si les permissions existent
      let validPermissions = [];
      if (permissions) {
        validPermissions = await this.prismaService.permission.findMany({
          where: { id: { in: permissions } },
        });

        if (validPermissions.length !== permissions.length) {
          throw new ValidationException({
            permissions: ['Certaines permissions fournies sont introuvables.'],
          });
        }
      }

      // Mise à jour du rôle
      const updatedRole = await this.prismaService.role.update({
        where: { id },
        data: {
          name: name || existingRole.name,
          code: code || existingRole.code,
          description: description,
          permissions: permissions
            ? {
              set: validPermissions.map((permission) => ({ id: permission.id })),
            }
            : undefined, // Si aucune permission n'est passée, ne modifiez pas
        },
        include: { permissions: true },
      });

      return { message: "La mise à jour du role éffectué avec succès" };

    } catch (error) {
      throw error;
    }

  }

  async remove(id: string) {
    try {
      const existingRole = await this.prismaService.role.findUnique({ where: { id } });
      if (!existingRole){
        throw new ValidationException({
          id: ['Role introuvables.'],
        });
      } 

      const dateRole = await this.prismaService.role.delete({
        where: { id }
      })

      return { message: "Role supprimée avec succes" }

    } catch (error) {
      throw error;
    }
  }

}
