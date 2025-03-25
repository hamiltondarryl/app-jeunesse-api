import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service'; // Ou le service utilisé pour la base de données

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupère les permissions requises depuis les métadonnées
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!requiredPermissions) {
      return true; // Si aucune permission n'est requise, accès autorisé
    }

    // Récupère l'utilisateur depuis la requête
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Récupère les permissions de l'utilisateur depuis la base de données
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id }, // Utilise l'ID de l'utilisateur
      include: {
        role: {
          include: {
            permissions: true, // Charge les permissions liées au rôle
          },
        },
      },
    });

    if (!userWithPermissions.activated) {
      throw new UnauthorizedException("Vous n'êtes pas autorisé à accéder à la plateforme, Compte déactivé !");
    }

    if (!userWithPermissions) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    const userPermissions = userWithPermissions.role.permissions.map(
      (permission) => permission.name,
    );

    // Vérifie si l'utilisateur possède toutes les permissions requises
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
      );
    }

    return hasPermission;
  }
}
