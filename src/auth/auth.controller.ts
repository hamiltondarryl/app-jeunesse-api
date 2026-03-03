import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { ResetPassDto } from './dto/reset_pass.dto';
import { ChangePassDto } from './dto/change_pass.dto';

@ApiTags("Authentication")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @ApiOperation({ summary: "Se connecter entant qu'utilisateur de l'espace d'administration" })
    @HttpCode(HttpStatus.OK)
    @Post('login-admin')
    async login(@Body() loginAdminDto: LoginAdminDto) {
        return await this.authService.loginAdmin(loginAdminDto);
    }

  @ApiOperation({ summary: "Réinitialiser le mot de passe de l'utilisateur" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('ACCESS_APP') // La permission requise
    @HttpCode(HttpStatus.OK)
    @Post('reset-password')
    async resetPassword(@Body() resetPassDto: ResetPassDto,  @Req() req) {
        const user = req.user;
        return await this.authService.resetPassword(resetPassDto, user.id);
    }

  @ApiOperation({ summary: "Changer le mot de passe de l'utilisateur" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('ACCESS_APP') // La permission requise
    @HttpCode(HttpStatus.OK)
    @Post('change-password')
    async changePassword(@Body() changePassDto: ChangePassDto, @Req() req) {
      const user = req.user;
        return await this.authService.changePassword(changePassDto, user.id);
    }
}