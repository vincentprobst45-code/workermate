import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

@Module({ imports: [PrismaModule], controllers: [PurchaseController], providers: [PurchaseService] })
export class PurchaseModule {}
