import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { get: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    reflector = { get: jest.fn() };
    prisma = { user: { findUnique: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = module.get(PermissionsGuard);
  });

  const context = (user?: { id: string }) =>
    ({
      getHandler: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as any;

  it('autorise si aucune permission n’est exigée', async () => {
    reflector.get.mockReturnValue(undefined);
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('refuse un utilisateur absent', async () => {
    reflector.get.mockReturnValue(['LIST_USER']);
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un utilisateur introuvable sans lever d’erreur nulle', async () => {
    reflector.get.mockReturnValue(['LIST_USER']);
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(context({ id: 'u1' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un compte désactivé', async () => {
    reflector.get.mockReturnValue(['LIST_USER']);
    prisma.user.findUnique.mockResolvedValue({
      activated: false,
      role: { permissions: [{ name: 'LIST_USER' }] },
    });
    await expect(guard.canActivate(context({ id: 'u1' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse si la permission manque', async () => {
    reflector.get.mockReturnValue(['LIST_USER']);
    prisma.user.findUnique.mockResolvedValue({
      activated: true,
      role: { permissions: [{ name: 'ACCESS_APP' }] },
    });
    await expect(guard.canActivate(context({ id: 'u1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('autorise si toutes les permissions sont présentes', async () => {
    reflector.get.mockReturnValue(['LIST_USER']);
    prisma.user.findUnique.mockResolvedValue({
      activated: true,
      role: { permissions: [{ name: 'LIST_USER' }] },
    });
    await expect(guard.canActivate(context({ id: 'u1' }))).resolves.toBe(true);
  });
});
