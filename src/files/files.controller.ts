import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import { extname, normalize, resolve } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@ApiTags('Fichiers protégés')
@ApiBearerAuth('access-token')
@Controller('files')
export class FilesController {
  @ApiOperation({ summary: 'Télécharger un document d’organisation (authentifié)' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('READ_ORGANISATION')
  @Get()
  download(@Query('path') filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new NotFoundException('Fichier introuvable');
    }

    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const requested = resolve(process.cwd(), normalize(filePath));

    if (!requested.startsWith(uploadsRoot)) {
      throw new ForbiddenException('Accès au fichier refusé');
    }

    const extension = extname(requested).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      throw new ForbiddenException('Type de fichier non autorisé');
    }

    if (!existsSync(requested)) {
      throw new NotFoundException('Fichier introuvable');
    }

    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(requested);
  }
}
