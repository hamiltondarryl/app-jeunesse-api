import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { LogScope } from 'src/generated/prisma/client';

@ApiTags('Journaux d’activité')
@Controller('log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @ApiOperation({ summary: 'Activités applicatives (connexions, comptes, validations…)' })
  @ApiBearerAuth('Bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOG')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'debut', required: false })
  @ApiQuery({ name: 'fin', required: false })
  @ApiQuery({ name: 'q', required: false })
  @Get('application')
  application(
    @Query('debut') debut?: string,
    @Query('fin') fin?: string,
    @Query('q') q?: string,
    @Query('roleCode') roleCode?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.activityLogService.search({
      scopes: [LogScope.APPLICATION, LogScope.METIER],
      debut,
      fin,
      q,
      roleCode,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @ApiOperation({ summary: 'Journaux système, filtrables par période' })
  @ApiBearerAuth('Bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOG_SYSTEME')
  @HttpCode(HttpStatus.OK)
  @Get('systeme')
  systeme(
    @Query('debut') debut?: string,
    @Query('fin') fin?: string,
    @Query('q') q?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.activityLogService.search({
      scopes: [LogScope.SYSTEME],
      debut,
      fin,
      q,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @ApiOperation({ summary: 'Activités applicatives de l’utilisateur connecté' })
  @ApiBearerAuth('Bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOG')
  @HttpCode(HttpStatus.OK)
  @Get('log-for-user')
  userLog(@Req() req) {
    return this.activityLogService.userLog(req.user.id);
  }

  @ApiOperation({ summary: 'Ancien endpoint : activités applicatives' })
  @ApiBearerAuth('Bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOG')
  @HttpCode(HttpStatus.OK)
  @Get('log-for-all')
  allLog() {
    return this.activityLogService.search({
      scopes: [LogScope.APPLICATION, LogScope.METIER],
      limit: 50,
    });
  }
}
