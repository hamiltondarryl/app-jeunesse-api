import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ValidationException } from 'src/validator-app/validation.exception';
import { SearchDepartmentDto } from './dto/pagination.dto';

@Injectable()
export class DepartementService {

    constructor(
      private prismaService: PrismaService,
    ) { }

    
  async create(createDepartementDto: CreateDepartementDto) {  
    try {

      // Vérification si un rôle avec le même nom existe déjà
      const existingDepartement  = await this.prismaService.departement.findFirst({
        where: { nom: createDepartementDto.nom },
      });

      if (existingDepartement) {
        throw new ValidationException({
          name: ['Ce rôle  existe déjà.'],
        });
      }


      const departement = await this.prismaService.departement.create({
        data: createDepartementDto,
      });
      return departement;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const departements = await this.prismaService.departement.findMany({
        include: {
          province: true,
        },
      });
      return departements;
    } catch (error) {
      throw error;
    }
  }

   // Rechercher  avec filtre
    async search(searchDepartmentDto : SearchDepartmentDto) {
      try {
        const where = searchDepartmentDto.searchQuery
          ? {
            OR: [
              {
                nom: {
                  contains: searchDepartmentDto.searchQuery,
                  mode: Prisma.QueryMode.insensitive
                },
              },
            ],
          }
          : {}; // Si pas de query, on ne filtre rien
  
        const items = await this.prismaService.departement.findMany({
          where,  // Filtre selon la recherche
          skip: (searchDepartmentDto.page - 1) * searchDepartmentDto.limit,  // Pagination
          take: searchDepartmentDto.limit,
          include : {
            province : true
          }, 
          orderBy: {
            province: {
              abreviation: 'asc'
            }
          }
          // Limite du nombre d'éléments par page
        });
  
        const total = await this.prismaService.departement.count({
          where,  // Compte les éléments selon le filtre
        });
  
        return {
          data: items,
          total: total, 
          page :searchDepartmentDto.page,
          limit : searchDepartmentDto.limit,
          lastPage: Math.ceil(total / searchDepartmentDto.limit),
        };
  
      } catch (error) {
        throw error;
      }
    }

  async findOne(id: string) {
   try {

     const departement = await this.prismaService.departement.findUnique({
        where: { id },
      });

      if (!departement) {
        throw new NotFoundException(`Département non trouvé`);
      }

    return departement;
   } catch (error) {
    throw error;

   }
  }

  async update(id: string, updateDepartementDto: UpdateDepartementDto) {
    try {
      
      const departementExit = await this.prismaService.departement.findUnique({
        where: { id },
      });

      if (!departementExit) {
        throw new NotFoundException(`Département non trouvé`);
      }

      const departement = this.prismaService.departement.update({
        where: { id },
        data: updateDepartementDto,
      });

      return departement;

      
    } catch (error) {
      
      throw error;
    }
  }

  async remove(id: string) {
    try {

       const departementExit = await this.prismaService.departement.findUnique({
        where: { id },
      });

      if (!departementExit) {
        throw new NotFoundException(`Département non trouvé`);
      }

      
      const departement = await this.prismaService.departement.delete({
        where: { id },
      });
      return departement; 


    } catch (error) {
      
      throw error;
    }
  }
}
