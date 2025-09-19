import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProvinceService } from './province.service';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchDepartmentDto } from 'src/departement/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';


@ApiTags("Gestion des provinces")
@Controller('province')
export class ProvinceController {
  constructor(private readonly provinceService: ProvinceService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_PROVINCE') // La permission requise
  @ApiOperation({ summary: "Créer un province" })
  @Post()
  async create(@Body() createProvinceDto: CreateProvinceDto) {
    return await this.provinceService.create(createProvinceDto);
  }

  @ApiOperation({ summary: "Récuperation des provinces" })
  @Get()
  async findAll() {
    return await this.provinceService.findAll();
  }

  @ApiOperation({ summary: "Récuperation des provinces avec filtre" })
  @Get('search')
  async search(@Query() searchDepartmentDto: SearchDepartmentDto) {
    return await this.provinceService.search(searchDepartmentDto);
  }

  @ApiOperation({ summary: "Récuperation d'un province" })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.provinceService.findOne(id);
  }

  @ApiOperation({ summary: "Mise à jour d'un province" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_PROVINCE') // La permission requise
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProvinceDto: UpdateProvinceDto) {
    return await this.provinceService.update(id, updateProvinceDto);
  }

  @ApiOperation({ summary: "Suppression d'un province" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DELETE_PROVINCE') // La permission requise
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.provinceService.remove(id);
  }
}
