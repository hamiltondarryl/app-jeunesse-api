import { Module } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { OrganisationController } from './organisation.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [OrganisationController],
  providers: [OrganisationService, PrismaService],
})
export class OrganisationModule {}
