import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
  
        const isPasswordValid = await bcrypt.compare(loginAdminDto.password, user.password);
        const reset = user.passwordIsRest
          ? await this.prismaService.passwordReset.findUnique({
              where: { email: user.email, code: loginAdminDto.password },
            })
          : null;
        const resetValid = Boolean(reset && !dayjs().isAfter(reset.expiresAt));

        if (!isPasswordValid && !resetValid) {
          throw new UnauthorizedException('Identifiants invalides');
        }
  
        const accessToken = await this.generateJwtToken(user.id, user.email, user.tokenVersion);
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
  async validateUser(userId: string, tokenVersion?: number): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.activated) {
      return null;
    }
    if (typeof tokenVersion === 'number' && user.tokenVersion !== tokenVersion) {
      return null;
    }
    return user;
  }

  async generateJwtToken(id: string, email: string, tokenVersion = 0): Promise<string> {
    const payload = { id, email, tv: tokenVersion };
    const secret = this.configService.get<string>('JWT_SECRET');
    return this.jwtService.sign(payload, { secret, expiresIn: '8h' });
  }

  private toPublicUser(user: User & { role?: { name: string; code: string; permissions?: { name: string }[] } }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name,
      codeRole: user.role?.code,
      permissions: user.role?.permissions?.map((item) => item.name) || [],
      activated: user.activated,
      passwordDefault: user.passwordDefault,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return this.toPublicUser(user);
  }

  async updateProfile(userId: string, data: { username: string; email: string }) {
    const current = await this.validateUser(userId);
    if (!current) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();

    const existingName = await this.prismaService.user.findFirst({
      where: { username, NOT: { id: userId } },
    });
    if (existingName) {
      throw new ConflictException('Ce nom est déjà utilisé');
    }

    const existingEmail = await this.prismaService.user.findFirst({
      where: { email, NOT: { id: userId } },
    });
    if (existingEmail) {
      throw new ConflictException('Cet e-mail est déjà utilisé');
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: { username, email },
    });

    return this.getProfile(userId);
  }

  async logout(userId: string) {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    await this.activityLogService.create(
      ActionType.LOGOUT,
      "s'est déconnecté",
      userId,
    );

    return { success: true, message: 'Déconnexion effectuée. Le jeton n’est plus valable.' };
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
      const passwordHash = await bcrypt.hash(new_password, 12);
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { password: passwordHash, passwordIsRest: false },
      });

      await this.activityLogService.create(
        ActionType.PASSWORD_RESET,
        "a fait une action de changement de mot de passe",
        user.id,
      );

      return { success: true }

    } catch (error) {
      throw error;
    }
   
  }

  async forgotPassword(email: string) {
    const genericResponse = {
      success: true,
      message: 'Si un compte existe pour cet e-mail, un code de réinitialisation a été généré.',
    };

    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user || !user.activated) {
      return genericResponse;
    }

    const code = this.generateResetCode();
    await this.prismaService.passwordReset.upsert({
      where: { email },
      update: {
        code,
        expiresAt: dayjs().add(30, 'minute').toDate(),
      },
      create: {
        email,
        code,
        expiresAt: dayjs().add(30, 'minute').toDate(),
      },
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { passwordIsRest: true },
    });

    await this.activityLogService.create(
      ActionType.FORGOT_PASSWORD,
      'a demandé une réinitialisation de mot de passe',
      user.id,
    );

    if (process.env.APP_STATUS === 'DEV') {
      return {
        ...genericResponse,
        code,
      };
    }

    return genericResponse;
  }

    // Changement du mot de passe de l'utilisateur
  async changePassword(changePassDto: ChangePassDto, userId: string) {

     try {
      const { old_password, new_password, confirm_password, confirm_new_password } = changePassDto;
      const user = await this.validateUser(userId);
      if (!user) throw new NotFoundException('Utilisateur non trouvé');
      const isPasswordValid = await bcrypt.compare(old_password, user.password);
      if (!isPasswordValid) throw new UnauthorizedException('Ancien mot de passe incorrect');
      const confirmation = confirm_password || confirm_new_password;
      if (new_password !== confirmation) throw new UnauthorizedException('Les mots de passe ne correspondent pas');
      const passwordHash = await bcrypt.hash(new_password, 12);
      const userUpdate = await this.prismaService.user.update({
        where: { id: user.id },
        data: { password: passwordHash, passwordDefault: false, tokenVersion: { increment: 1 } },
      });

      await this.activityLogService.create(
        ActionType.PASSWORD_CHANGE,
        "a modifié le mot de passe",
        userUpdate.id,
      );

      const accessToken = await this.generateJwtToken(
        userUpdate.id,
        userUpdate.email,
        userUpdate.tokenVersion,
      );

      return { success: true, accessToken };

    } catch (error) {
      throw error;
    }
    }
}
