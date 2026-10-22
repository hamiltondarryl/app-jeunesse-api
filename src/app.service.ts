import { Injectable, OnModuleInit } from '@nestjs/common';
import { ActivityLogService } from './activity-log/activity-log.service';
import { ActionType } from './generated/prisma/client';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly activityLogService: ActivityLogService) {}

  async onModuleInit() {
    await this.activityLogService.create(
      ActionType.SYSTEM_BOOT,
      `API démarrée (${process.env.APP_STATUS || 'PROD'})`,
    );
  }
}
