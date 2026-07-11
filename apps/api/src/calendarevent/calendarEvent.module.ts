import { Module } from '@nestjs/common';
import { CalendarEventService } from './calendarEvent.service';
import { CalendarEventController } from './calendarEvent.controller'
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CalendarEventService],
  controllers: [CalendarEventController],
})
export class CalendarEventModule {}
