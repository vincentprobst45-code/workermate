import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantService, StorageService],
})
export class TenantModule {}
