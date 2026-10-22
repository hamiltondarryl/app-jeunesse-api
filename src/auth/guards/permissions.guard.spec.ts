import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  function guardFor(user: unknown, permissions: string[] | undefined, prismaUser: unknown) {
    const reflector = {
      get: () => permissions,
    } as unknown as Reflector;
    const prisma = {
      user: {
        findUnique: async () => prismaUser,
      },
    };
    const guard = new PermissionsGuard(reflector, prisma as never);
    const context = {
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    };
    return guard.canActivate(context as never);
  }

  it('autorise une route sans permission exigée', async () => {
    await expect(guardFor({ id: '1' }, undefined, null)).resolves.toBe(true);
  });

  it('refuse un rôle qui ne possède pas le droit', async () => {
    await expect(
      guardFor(
        { id: '1' },
        ['DELETE_ORGANISATION'],
        {
          activated: true,
          role: { permissions: [{ name: 'LIST_ORGANISATION' }] },
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('autorise le rôle qui possède le droit', async () => {
    await expect(
      guardFor(
        { id: '1' },
        ['UPDATE_ORGANISATION'],
        {
          activated: true,
          role: { permissions: [{ name: 'UPDATE_ORGANISATION' }] },
        },
      ),
    ).resolves.toBe(true);
  });
});
