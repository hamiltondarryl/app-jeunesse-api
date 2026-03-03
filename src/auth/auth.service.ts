import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtService } from '@nestjs/jwt';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActionType, User } from 'src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';
import { ResetPassDto } from './dto/reset_pass.dto';
import { ChangePassDto } from './dto/change_pass.dto';



@Injectable()
export class AuthService {

  constructor(
    private prismaService: PrismaService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private readonly activityLogService: ActivityLogService
  ) {
  }

  // Authentification de l'utilisateur
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
            activated : user.activated,
            passwordDefault : user.passwordDefault
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

  // Réinitialisation du mot de passe de l'utilisateur
  async resetPassword(resetPassDto: ResetPassDto, userId: string) {

    try {
      const { code, new_password, confirm_password } = resetPassDto
      if (new_password !== confirm_password) throw new UnauthorizedException('Les mots de passe ne correspondent pas');
      const user = await this.validateUser(userId);
      const existCode = await this.prismaService.passwordReset.findUnique(
        { where: { email: user.email, code: code } });

      if (!existCode) throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
      if (!existCode || existCode.code !== code || dayjs().isAfter(existCode.expiresAt)) throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
      const passwordHash = await bcrypt.hash(new_password, 10);
      const userUpdate = await this.prismaService.user.update({
        where: { id: user.id },
        data: { password: passwordHash, passwordIsRest: false }
      });

      const log = await this.activityLogService.create(
        ActionType.PASSWORD_RESET,
        "a fait une action de changement de mot de passe",
        user.id,
      );

      return { success: true }

    } catch (error) {
      throw error;
    }
   
  }

    // Changement du mot de passe de l'utilisateur
  async changePassword(changePassDto: ChangePassDto, userId: string) {

     try {
      const { old_password, new_password, confirm_password } = changePassDto;
      const user = await this.validateUser(userId);
      if (!user) throw new NotFoundException('Utilisateur non trouvé');
      const isPasswordValid = await bcrypt.compare(old_password, user.password);
      if (!isPasswordValid) throw new UnauthorizedException('Ancien mot de passe incorrect');
      if (new_password !== confirm_password) throw new UnauthorizedException('Les mots de passe ne correspondent pas');
      const passwordHash = await bcrypt.hash(new_password, 10);
      const userUpdate = await this.prismaService.user.update({
        where: { id: user.id },
        data: { password: passwordHash, passwordDefault: false },
      });

      const log = await this.activityLogService.create(
        ActionType.PASSWORD_CHANGE,
        "a modifié le mot de passe",
        userUpdate.id,
      )

      return { success: true }  // Si tout s'est bien passé, renvoi du message de succès

    } catch (error) {
      throw error;
    }
    }
}
