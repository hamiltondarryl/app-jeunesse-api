import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
}
