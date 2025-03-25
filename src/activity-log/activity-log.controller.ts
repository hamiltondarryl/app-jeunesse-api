import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@ApiTags("Log des activités des utilisateurs")
@Controller('log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @ApiOperation({ summary: "Les log d'un utilisateur"})
  @ApiBearerAuth("Bearer")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOG') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get('log-for-user')
  userLog(@Req() req) {
    const user = req.user;
    return this.activityLogService.userLog(user.id);
  }

  @ApiOperation({ summary: "Liste de tout les logs"})
  @ApiBearerAuth("Bearer")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOG') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get('log-for-all')
  allLog(@Req() req) {
    const user = req.user;
    return this.activityLogService.allLog();
  }
}
