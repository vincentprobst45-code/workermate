import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CatalogItemController } from './catalogitem.controller';
import { CatalogItemService } from './catalogitem.service';

@Module({
  imports: [PrismaModule],
  providers: [CatalogItemService],
  controllers: [CatalogItemController],
})
export class CatalogItemModule {}
