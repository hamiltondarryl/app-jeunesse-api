import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, HttpStatus } from '@nestjs/common';
import { DashbordService } from './dashbord.service';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@ApiTags("Tableau de bord")
@Controller('dashbord')
export class DashbordController {
  
  constructor(private readonly dashbordService: DashbordService) { }

  @ApiOperation({ summary: "Récupérer les données du tableau de bord" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ACCESS_APP') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll() {
    return await this.dashbordService.findAll();
  }
}
