import { Injectable } from '@nestjs/common';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActionType } from '@prisma/client';

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prismaService : PrismaService
  ) {}
  
  async create(action: ActionType, description: string, userId: string) {
    try {
      await this.prismaService.activityLog.create({
        data: {
          action,
          description,
          userId,
        },
      });
      console.log(`[LOG] Action enregistrée : ${action} - ${description}`);
    } catch (error) {
      throw error;
    }
  }
  async userLog( userId: string) {
    try {
      const activityLog = await this.prismaService.activityLog.findMany({
        where: { userId : userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            include :{
              role: true
            }
          },
        },
      })
      return activityLog;
    } catch (error) {
      throw error;
    }
  }

  async allLog() {
    try {
      const activityLog = await this.prismaService.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            include :{
              role: true
            }
          },  
        },
      })
      return activityLog;
    } catch (error) {
      throw error;
    }
  }
}
