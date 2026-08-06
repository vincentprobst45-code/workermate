import { Module } from '@nestjs/common';
import { WorkOrderService } from './workorder.service';
import { WorkOrderController } from './workorder.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WorkOrderService],
  controllers: [WorkOrderController],
})
export class WorkOrderModule {}