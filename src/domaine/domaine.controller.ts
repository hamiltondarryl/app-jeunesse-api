import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { DomaineService } from './domaine.service';
import { CreateDomaineDto } from './dto/create-domaine.dto';
import { UpdateDomaineDto } from './dto/update-domaine.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags("Gestion des domaines")
@Controller('domaine')
export class DomaineController {
  constructor(private readonly domaineService: DomaineService) {}

  @ApiOperation({ summary: "Créer un domaine" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_DOMAINE') // La permission requise
  @HttpCode(HttpStatus.CREATED)
  @Post()
 async  create(@Body() createDomaineDto: CreateDomaineDto) {
    return await this.domaineService.create(createDomaineDto);
  }

  @ApiOperation({ summary: "Lister les domaines" })
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll() {
    return await this.domaineService.findAll();
  }

  @ApiOperation({ summary: "Rechercher des domaines " })
  @HttpCode(HttpStatus.OK)
  @Get('search')
  async search( @Query('searchQuery') searchQuery: string,
  @Query('page', ParseIntPipe) page: number = 1,
  @Query('limit', ParseIntPipe) limit: number = 10,) {
    return await this.domaineService.search(page, limit, searchQuery);
  }

  @ApiOperation({ summary: "Rechercher un domaine" })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('READ_DOMAINE') // La permission requise
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.domaineService.findOne(id);
  }

  @ApiOperation({ summary: "Modifier un domaine" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_DOMAINE') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDomaineDto: UpdateDomaineDto) {
    return await this.domaineService.update(id, updateDomaineDto);
  }

  @ApiOperation({ summary: "Supprimer un domaine" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DELETE_DOMAINE') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.domaineService.remove(id);
  }
}
