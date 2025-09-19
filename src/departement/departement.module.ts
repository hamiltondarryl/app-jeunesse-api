import { Module } from '@nestjs/common';
import { DepartementService } from './departement.service';
import { DepartementController } from './departement.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DepartementController],
  providers: [DepartementService, PrismaService],
})
export class DepartementModule {}
