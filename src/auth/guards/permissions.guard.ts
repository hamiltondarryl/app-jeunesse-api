import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;
    if (!user?.id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!userWithPermissions) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (!userWithPermissions.activated) {
      throw new UnauthorizedException(
        "Vous n'êtes pas autorisé à accéder à la plateforme, Compte déactivé !",
      );
    }

    const userPermissions = userWithPermissions.role.permissions.map((permission) => permission.name);
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
      );
    }

    return true;
  }
}
