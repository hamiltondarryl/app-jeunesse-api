import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDepartmentDto } from 'src/departement/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProvinceService {


  constructor(
    private prismaService: PrismaService,
  ) { }


  async create(createProvinceDto: CreateProvinceDto) {
    try {

      const province = await this.prismaService.province.create({
        data: createProvinceDto,
      });
      return province;


    } catch (error) {

      throw error;
    }

  }

  async findAll() {
    try {
      const provinces = await this.prismaService.province.findMany();
      return provinces;
    } catch (error) {
      throw error;
    }
  }

  async search(searchDepartmentDto: SearchDepartmentDto) {
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
            {
              abreviation: {
                contains: searchDepartmentDto.searchQuery,
                mode: Prisma.QueryMode.insensitive
              }
            }
          ],
        }
        : {}; // Si pas de query, on ne filtre rien

      const items = await this.prismaService.province.findMany({
        where,  // Filtre selon la recherche
        skip: (searchDepartmentDto.page - 1) * searchDepartmentDto.limit,  // Pagination
        take: searchDepartmentDto.limit,

        // Limite du nombre d'éléments par page
      });

      const total = await this.prismaService.province.count({
        where,  // Compte les éléments selon le filtre
      });

      return {
        data: items,
        total: total,
        page: searchDepartmentDto.page,
        limit: searchDepartmentDto.limit,
        lastPage: Math.ceil(total / searchDepartmentDto.limit),
      };

    } catch (error) {
      throw error;
    }
  }


  async findOne(id: string) {
    try {
      const departement = await this.prismaService.province.findUnique({
        where: { id },
      });

      if (!departement) {
        throw new NotFoundException(`Province non trouvé`);
      }
      return departement;
    } catch (error) {
      throw error;
    }

  }

  async update(id: string, updateProvinceDto: UpdateProvinceDto) {
    try {

      const provinceExit = await this.prismaService.province.findUnique({
        where: { id },
      });

      if (!provinceExit) {
        throw new NotFoundException(`Province non trouvé`);
      }

      return await this.prismaService.province.update({
        where: { id },
        data: updateProvinceDto,
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const provinceExit = await this.prismaService.province.findUnique({
        where: { id },
      });

      if (!provinceExit) {
        throw new NotFoundException(`Province non trouvé`);
      }

      return await this.prismaService.province.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
    
  }
}
