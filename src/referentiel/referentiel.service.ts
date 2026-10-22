import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationException } from 'src/validator-app/validation.exception';
import { CreateReferentielDto } from './dto/create-referentiel.dto';
import { UpdateReferentielDto } from './dto/update-referentiel.dto';

@Injectable()
export class ReferentielService {
  constructor(private readonly prisma: PrismaService) {}

  findActifs(categorie?: string) {
    return this.prisma.referentiel.findMany({
      where: {
        actif: true,
        ...(categorie ? { categorie } : {}),
      },
      orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }, { libelle: 'asc' }],
      select: {
        id: true,
        categorie: true,
        code: true,
        libelle: true,
        ordre: true,
      },
    });
  }

  async search(page = 1, limit = 10, searchQuery = '', categorie?: string) {
    const where: Prisma.ReferentielWhereInput = {
      ...(categorie ? { categorie } : {}),
      ...(searchQuery
        ? {
            OR: [
              { libelle: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
              { code: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
              { categorie: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.referentiel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }, { libelle: 'asc' }],
      }),
      this.prisma.referentiel.count({ where }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit) || 1,
    };
  }

  async create(dto: CreateReferentielDto) {
    const existing = await this.prisma.referentiel.findUnique({
      where: {
        categorie_code: {
          categorie: dto.categorie,
          code: dto.code.trim(),
        },
      },
    });

    if (existing) {
      throw new ValidationException({
        code: ['Cette valeur existe déjà dans cette catégorie'],
      });
    }

    await this.prisma.referentiel.create({
      data: {
        categorie: dto.categorie,
        code: dto.code.trim(),
        libelle: dto.libelle.trim(),
        ordre: dto.ordre ?? 0,
      },
    });

    return { message: 'Référentiel créé avec succès' };
  }

  async update(id: string, dto: UpdateReferentielDto) {
    const current = await this.prisma.referentiel.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Référentiel introuvable');
    }

    const categorie = dto.categorie ?? current.categorie;
    const code = dto.code?.trim() ?? current.code;

    if (categorie !== current.categorie || code !== current.code) {
      const existing = await this.prisma.referentiel.findUnique({
        where: { categorie_code: { categorie, code } },
      });
      if (existing && existing.id !== id) {
        throw new ValidationException({
          code: ['Cette valeur existe déjà dans cette catégorie'],
        });
      }
    }

    await this.prisma.referentiel.update({
      where: { id },
      data: {
        categorie,
        code,
        libelle: dto.libelle?.trim() ?? current.libelle,
        ordre: dto.ordre ?? current.ordre,
        actif: dto.actif ?? current.actif,
      },
    });

    return { message: 'Référentiel modifié avec succès' };
  }

  async remove(id: string) {
    const current = await this.prisma.referentiel.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Référentiel introuvable');
    }
    await this.prisma.referentiel.delete({ where: { id } });
    return { message: 'Référentiel supprimé avec succès' };
  }
}
