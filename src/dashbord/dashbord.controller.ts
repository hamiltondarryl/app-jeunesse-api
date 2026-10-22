import { Controller, Get, Header, HttpCode, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import { DashbordService } from './dashbord.service';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Response } from 'express';

@ApiTags('Tableau de bord')
@Controller('dashbord')
export class DashbordController {
  constructor(private readonly dashbordService: DashbordService) {}

  @ApiOperation({ summary: 'Récupérer les données du tableau de bord' })
  @ApiQuery({ name: 'debut', required: false })
  @ApiQuery({ name: 'fin', required: false })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ACCESS_APP')
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(@Req() req, @Query('debut') debut?: string, @Query('fin') fin?: string) {
    return this.dashbordService.forUser(req.user.id, debut, fin);
  }

  @ApiOperation({ summary: 'Exporter le tableau de bord en Excel' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DASHBORD_EXPORT')
  @Get('export/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportExcel(
    @Req() req,
    @Query('debut') debut: string,
    @Query('fin') fin: string,
    @Res() res: Response,
  ) {
    const buffer = await this.dashbordService.exportExcel(req.user.id, debut, fin);
    const filename = `tableau-de-bord-jeunesse.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
