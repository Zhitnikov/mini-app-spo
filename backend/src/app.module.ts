import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ShopModule } from './shop/shop.module';
import { EventsModule } from './events/events.module';
import { AchievementsModule } from './achievements/achievements.module';
import { UploadModule } from './upload/upload.module';
import { MiscModule } from './misc/misc.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ShopModule,
    EventsModule,
    AchievementsModule,
    UploadModule,
    MiscModule,
  ],
  providers: [AuthGuard],
})
export class AppModule {}
