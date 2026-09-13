import { Module } from '@nestjs/common';
import { ReferentielController } from './referentiel.controller';
import { ReferentielService } from './referentiel.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ReferentielController],
  providers: [ReferentielService, PrismaService],
  exports: [ReferentielService],
})
export class ReferentielModule {}
