import { Module } from '@nestjs/common';
import { DomaineService } from './domaine.service';
import { DomaineController } from './domaine.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DomaineController],
  providers: [DomaineService, PrismaService],
})
export class DomaineModule {}
