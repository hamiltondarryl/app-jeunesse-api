import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtService } from '@nestjs/jwt';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActionType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';



@Injectable()
export class AuthService {

  constructor(
    private prismaService: PrismaService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private readonly activityLogService: ActivityLogService
  ) {
  }

  async loginAdmin(loginAdminDto: LoginAdminDto){
    try {
        // Recherche de l'utilisateur par email
        const user = await this.prismaService.user.findUnique({
          where: { email : loginAdminDto.email },
          include: {
            role: {
              include: {
                permissions: true, // Inclure les permissions associées au rôle
              },
            },
          },
        });
  
        // Vérification si l'utilisateur existe
        if (!user) {
          throw new UnauthorizedException('Identifiants invalides');
        }
  
        if (!user.activated) {
          throw new UnauthorizedException("Vous n'êtes pas autorisé à accéder à la plateforme, Compte déactivé !");
        }
  
        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(loginAdminDto.password, user.password);
  
        if (!user.passwordIsRest) {
          if (!isPasswordValid) {
            throw new UnauthorizedException('Identifiants invalides');
          }
        } else {
          const existCode = await this.prismaService.passwordReset.findUnique(
            { where: { email: user.email, code: loginAdminDto.password } });
  
          if (!existCode) throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
          if (!existCode || existCode.code !== loginAdminDto.password || dayjs().isAfter(existCode.expiresAt)) throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
        }
  
        const accessToken = await this.generateJwtToken(user.id, user.email);
        const permissions = user.role.permissions.map((p) => p.name)
  
      const log = await this.activityLogService.create(
          ActionType.LOGIN,
          "s'est connecté",
          user.id,
        );
  
        return {
          accessToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            codeRole: user.role.code,
            passwordIsRest: user.passwordIsRest,
            permissions : permissions,
          },
        };
    } catch (error) {
      throw error;
    }
  }


  // Verification de l'utilisateur
  async validateUser(userId: string): Promise<User> {
    try {
      return this.prismaService.user.findUnique({
        where: { id: userId },
      });
    } catch (error) {
      throw error;
    }
  }

   // Génération d'un jeton JWT avec le userId et l'email de l'utilisateur
   async generateJwtToken(id: string, email: string): Promise<string> {
    const payload = { id, email };
    const secret = this.configService.get<string>('JWT_SECRET');
    return await this.jwtService.sign(payload, { secret });
  }

  // Génération d'un code de réinitialisation de mot de passe aléatoire avec 6 caractères (lettres majuscules, minuscules et chiffres)
  generateResetCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
