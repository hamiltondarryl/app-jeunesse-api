import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import * as bcrypt from 'bcryptjs';
import { ActionType } from 'src/generated/prisma/client';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaClientKnownRequestError } from '../../src/generated/prisma/internal/prismaNamespace';
import { ValidationException } from 'src/validator-app/validation.exception';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  // Créer un utilisateur
  async create(createUserDto: CreateUserDto, userId: string) {
    try {
      const { username, email, roleId } = createUserDto;
      const defaultPassword = await bcrypt.hash('azerty', 10);
      const existRole = await this.prismaService.role.findUnique({ where: { id: roleId } });

      if (!existRole) {
        throw new ValidationException({
          roleId: ["Ce role n'existe pas"],
        });
      }

      const existingName = await this.prismaService.user.findUnique({ where: { username: username } });
      if (existingName) {
        throw new ValidationException({
          username: ['Ce nom existe déjà'],
        });
      }

      const existingEmail = await this.prismaService.user.findUnique({ where: { email: email } });

      if (existingEmail) {
        throw new ValidationException({
          email: ['Cet email existe déjà'],
        });
      }

      await this.prismaService.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: defaultPassword,
          roleId: createUserDto.roleId
        }
      })

      // Log de l'activité
      await this.activityLogService.create(
        ActionType.ACCOUNT_CREATED,
        `Création du compte : ${username} avec le role ${existRole.name}`,
        userId
      );

      return { message: "L'utilisateur a été créé avec succès " };

    } catch (error) {
      throw error;
    }
  }

  // Liste des utilisateurs
  async findAll() {
    const users = await this.prismaService.user.findMany({
      include: {
        role: true
      }
    })
    return users;
  }

  // Recherche des utilisateurs
  async search(page: number = 1, limit: number = 10, searchQuery: string = '') {
    try {
      const where = searchQuery
        ? {
          OR: [
            {
              username: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive
              },
            },
            {
              email: {
                contains: searchQuery,
                mode: Prisma.QueryMode.insensitive
              }
            } // 'insensitive' pour rendre la recherche insensible à la casse
          ],
        }
        : {}; // Si pas de query, on ne filtre rien

      const users = await this.prismaService.user.findMany({
        where,  // Filtre selon la recherche
        skip: (page - 1) * limit,  // Pagination
        take: limit,
        include: {
          role: true
        },
        orderBy: {
          createdAt: 'desc'
        }
        // Limite du nombre d'éléments par page
      });

      const total = await this.prismaService.user.count({
        where,  // Compte les éléments selon le filtre
      });

      return {
        data: users,
        total: total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      throw error;
    }

  }


  // Afiicher un utilisateur
  async findOne(id: string) {
    try {
      const existin = await this.prismaService.user.findUnique({
        where: { id }, include: {
          role: true
        },
      });
      if (!existin) throw new NotFoundException("Cet utilisateur n'existe pas ");
      return existin;
    } catch (error) {
      throw error;
    }
  }

  // MIse à jour d'un utilisateur
  async update(id: string, updateUserDto: UpdateUserDto) {
    const { username, email, roleId } = updateUserDto;
    const existin = await this.prismaService.user.findUnique({ where: { id } });
    if (!existin) {
      throw new ValidationException({
        username: ["Cet utilisateur n'existe pas"],
      });
    }
    const emailExist = await this.prismaService.user.findUnique({ where: { email } });
    if (emailExist && emailExist.id != id) {
      throw new ValidationException({
        email: ["Cet email existe déjà"],
      });
    }

    await this.prismaService.user.update({
      where: { id },
      data: {
        username: username,
        email: email,
        roleId: roleId
      }
    })

    return { message: "L'utilisateur a été mis à jour avec succès" };
  }

  // Activer ou desactiver un utilisateur
  async activated(id: string, userId: string) {
    try {
      if(id === userId){
        throw new NotFoundException("Vous ne pouvez pas vous activer ou desactiver vous-meme");
      }
      const existin = await this.prismaService.user.findUnique({ where: { id } });
      if (!existin) throw new NotFoundException("Cet utilisateur n'existe déjà");

      const userUpdate = await this.prismaService.user.update({
        where: { id },
        data: {
          activated: !existin.activated
        }
      })

      // Log de l'activité

      const description = existin.activated ? 'Déactivation du compte ' + userUpdate.username : "Activation du compte " + userUpdate.username;
      await this.activityLogService.create(
        ActionType.ACCOUNT_ACTIVATION,
        description,
        userId
      );

      return { message: "Modification de l'activation du compte" }

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            "Informations d'identification déjà prises"
          )
        }
        if (error.code === 'P2003') {
          throw new ForbiddenException(
            "Violation de suppression, cette ressource est parent, "
          )
        }
      } else {
        throw error;
      }
    }
  }
}
