import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags("Gestion des organisations")
@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Post()
  create(@Body() createOrganisationDto: CreateOrganisationDto) {
    return this.organisationService.create(createOrganisationDto);
  }

  @ApiOperation({ summary: "Récuperation des organisations" })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.organisationService.findAll();
  }

  @ApiOperation({ summary: "Récuperation des organisations avec filtre" })
  @HttpCode(HttpStatus.OK)
  @Get('search')
  search(@Param('page') page: number, @Param('limit') limit: number, @Param('searchQuery') searchQuery: string) {
    return this.organisationService.search(page, limit, searchQuery);
  }

  @ApiOperation({ summary: "Récuperation des organisations par domaine" })
  @HttpCode(HttpStatus.OK)
  @Get('domaines/:id')
  findByDomaines(@Param('id') id: string) {
    return this.organisationService.findByDomaineId(id);
  }
  @ApiOperation({ summary: "Récuperation des organisations par province" })
  @HttpCode(HttpStatus.OK)
  @Get('provinces/:id')
  findByProvinces(@Param('id') id: string) {
    return this.organisationService.findByProvinceId(id);
  }

  @ApiOperation({ summary: "Récuperation d'une organisation" })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organisationService.findOne(id);
  }

  @ApiOperation({ summary: "Mise à jour d'une organisation" })
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrganisationDto: UpdateOrganisationDto) {
    return this.organisationService.update(+id, updateOrganisationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organisationService.remove(+id);
  }
}
