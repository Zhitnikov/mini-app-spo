import { Module } from '@nestjs/common';
import { BadgesController, NotificationsController } from '../misc.controllers';
import { BadgesService, NotificationsService } from '../misc.services';

@Module({
  controllers: [BadgesController, NotificationsController],
  providers: [BadgesService, NotificationsService],
})
export class MiscModule {}
