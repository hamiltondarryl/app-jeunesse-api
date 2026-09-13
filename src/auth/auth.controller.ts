import { Controller, Get, Post, Body, Patch, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';
import { ResetPassDto } from './dto/reset_pass.dto';
import { ChangePassDto } from './dto/change_pass.dto';
import { ForgetPassDto } from './dto/forget_pass.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags("Authentication")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @ApiOperation({ summary: "Se connecter en tant qu'utilisateur de l'espace d'administration" })
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @Post('login-admin')
    async login(@Body() loginAdminDto: LoginAdminDto) {
        return await this.authService.loginAdmin(loginAdminDto);
    }

  @ApiOperation({ summary: "Demander un code de réinitialisation de mot de passe" })
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @Post('forgot-password')
    async forgotPassword(@Body() forgetPassDto: ForgetPassDto) {
        return await this.authService.forgotPassword(forgetPassDto.email);
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

  @ApiOperation({ summary: "Profil de l'utilisateur connecté" })
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Get('me')
    me(@Req() req) {
      return this.authService.getProfile(req.user.id);
    }

  @ApiOperation({ summary: "Modifier mon compte" })
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Patch('me')
    updateMe(@Body() updateProfileDto: UpdateProfileDto, @Req() req) {
      return this.authService.updateProfile(req.user.id, updateProfileDto);
    }

  @ApiOperation({ summary: "Se déconnecter et invalider le jeton" })
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Req() req) {
      return this.authService.logout(req.user.id);
    }
}