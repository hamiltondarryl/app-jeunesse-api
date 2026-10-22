import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Global()
@Module({
  imports: [ActivityLogModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
