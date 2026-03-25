import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health.module';
import { AuthModule } from './modules/auth.module';
import { ShopModule } from './modules/shop.module';
import { EventsModule } from './modules/events.module';
import { AchievementsModule } from './modules/achievements.module';
import { UploadModule } from './modules/upload.module';
import { MiscModule } from './modules/misc.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    ShopModule,
    EventsModule,
    AchievementsModule,
    UploadModule,
    MiscModule,
  ],
})
export class AppModule {}
