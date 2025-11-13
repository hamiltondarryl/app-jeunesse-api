import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DepartementService } from './departement.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchDepartmentDto } from './dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';


@ApiTags("Gestion des départements")
@Controller('departement')
export class DepartementController {
  constructor(private readonly departementService: DepartementService) { }

  @ApiOperation({ summary: "Créer un département" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_DEPARTEMENT') // La permission requise
  @Post()
  async create(@Body() createDepartementDto: CreateDepartementDto) {
    return await this.departementService.create(createDepartementDto);
  }

  @ApiOperation({ summary: "Récuperation des départements" })
  @Get()
  async findAll() {
    return await this.departementService.findAll();
  }

  @ApiOperation({ summary: "Récuperation des départements avec filtre" })
  @Get('search')
  async search(@Query() searchDepartmentDto: SearchDepartmentDto) {
    return await this.departementService.search(searchDepartmentDto);
  }

  @ApiOperation({ summary: "Récuperation d'un département" })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.departementService.findOne(id);
  }

  @ApiOperation({ summary: "Mise à jour d'un département" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_DEPARTEMENT') // La permission requise
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepartementDto: UpdateDepartementDto) {
    return this.departementService.update(id, updateDepartementDto);
  }

  @ApiOperation({ summary: "Suppression d'un département" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DELETE_DEPARTEMENT') // La permission requise
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departementService.remove(id);
  }
}
