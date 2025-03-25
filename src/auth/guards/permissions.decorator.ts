// src/auth/guards/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

// Le décorateur doit être défini comme suit :
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
