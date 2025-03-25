import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, HttpCode, Query, ParseIntPipe } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@ApiTags("Gestion des permissions")
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @ApiOperation({ summary: "Créer une permission" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_PERMISSION') // La permission requise
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

    @ApiOperation({ summary: "Lister les permissions" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('LIST_PERMISSION') // La permission requise
    @HttpCode(HttpStatus.OK)
    @Get()
    findAll() {
      return this.permissionService.findAll();
    }
  
    @ApiOperation({ summary: "Rechercher des permissions" })
    @HttpCode(HttpStatus.OK)
    @Get('search')
    search( @Query('searchQuery') searchQuery: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,) {
      return this.permissionService.search(page, limit, searchQuery);
    }
  
    @ApiOperation({ summary: "Afficher un service" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('READ_PERMISSION') // La permission requise
    @HttpCode(HttpStatus.OK)
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.permissionService.findOne(id);
    }
  
    @ApiOperation({ summary: "Modififier une permission" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('UPDATE_PERMISSION') // La permission requise
    @HttpCode(HttpStatus.OK)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
      return this.permissionService.update(id, UpdatePermissionDto);
    }
  
    @ApiOperation({ summary: "Supprimer une permission" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('DELETE_PERMISSION')
    @HttpCode(HttpStatus.OK) 
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.permissionService.remove(id);
    }
}
