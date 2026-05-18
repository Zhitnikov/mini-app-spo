import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { TreasurySyncService } from './treasury-sync.service';
import { MaterialsService } from './materials.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResourcesController],
  providers: [TreasurySyncService, MaterialsService],
  exports: [TreasurySyncService, MaterialsService],
})
export class ResourcesModule {}
