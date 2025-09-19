import { Module } from '@nestjs/common';
import { ProvinceService } from './province.service';
import { ProvinceController } from './province.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProvinceController],
  providers: [ProvinceService, PrismaService],
})
export class ProvinceModule {}
