import { Module } from '@nestjs/common';
import { EditionService } from './edition.service';
import { EditionController } from './edition.controller';

@Module({
  controllers: [EditionController],
  providers: [EditionService],
})
export class EditionModule {}
