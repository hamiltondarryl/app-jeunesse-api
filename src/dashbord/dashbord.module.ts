import { Module } from '@nestjs/common';
import { DashbordService } from './dashbord.service';
import { DashbordController } from './dashbord.controller';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DashbordController],
  providers: [DashbordService, PrismaService, JwtService],
})
export class DashbordModule {}
