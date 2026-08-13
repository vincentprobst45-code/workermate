import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { WorkLogController } from './worklog.controller';
import { WorkLogService } from './worklog.service';

@Module({ imports: [PrismaModule], controllers: [WorkLogController], providers: [WorkLogService] })
export class WorkLogModule {}