import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [UsersModule, ShopModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
