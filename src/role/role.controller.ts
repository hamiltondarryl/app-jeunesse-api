import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Query, ParseIntPipe } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';

@ApiTags("Gestion des rôles ")
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) { }

  @ApiOperation({ summary: "Créer un rôle" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_ROLE') // La permission requise
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @ApiOperation({ summary: "Lister les rôles" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_ROLE') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll() {
    return await this.roleService.findAll();
  }

  @ApiOperation({ summary: "Rechercher des rôles" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_ROLE')
  @HttpCode(HttpStatus.OK)
  @Get('search')
  search(@Query('searchQuery') searchQuery: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,) {
    return this.roleService.search(page, limit, searchQuery);
  }

  @ApiOperation({ summary: "Afficher un rôle" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('READ_ROLE') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @ApiOperation({ summary: "Modififier un rôle" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_ROLE') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: "Supprimer un rôle" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DELETE_ROLE')
  @HttpCode(HttpStatus.OK) 
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  

}
