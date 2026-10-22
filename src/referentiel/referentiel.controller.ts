import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Public } from 'src/auth/guards/public.decorator';
import { CreateReferentielDto } from './dto/create-referentiel.dto';
import { UpdateReferentielDto } from './dto/update-referentiel.dto';
import { ReferentielService } from './referentiel.service';

@ApiTags('Référentiels')
@Controller('referentiels')
export class ReferentielController {
  constructor(private readonly referentielService: ReferentielService) {}

  @ApiOperation({ summary: 'Lister les valeurs actives (formulaire public et dossiers)' })
  @ApiQuery({ name: 'categorie', required: false })
  @Public()
  @Get()
  findAll(@Query('categorie') categorie?: string) {
    return this.referentielService.findActifs(categorie);
  }

  @ApiOperation({ summary: 'Administrer les référentiels' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_REFERENTIEL')
  @HttpCode(HttpStatus.OK)
  @Get('admin')
  search(
    @Query('searchQuery') searchQuery = '',
    @Query('categorie') categorie?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.referentielService.search(page, limit, searchQuery, categorie);
  }

  @ApiOperation({ summary: 'Créer une valeur de référentiel' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_REFERENTIEL')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateReferentielDto) {
    return this.referentielService.create(dto);
  }

  @ApiOperation({ summary: 'Modifier une valeur de référentiel' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_REFERENTIEL')
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferentielDto) {
    return this.referentielService.update(id, dto);
  }

  @ApiOperation({ summary: 'Supprimer une valeur de référentiel' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DELETE_REFERENTIEL')
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referentielService.remove(id);
  }
}
