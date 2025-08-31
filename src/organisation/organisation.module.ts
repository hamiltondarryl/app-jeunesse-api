import { Module } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { OrganisationController } from './organisation.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [OrganisationController],
  providers: [OrganisationService, PrismaService],
})
export class OrganisationModule {}
