import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AchievementsModule } from '../achievements/achievements.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [AchievementsModule, ShopModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
