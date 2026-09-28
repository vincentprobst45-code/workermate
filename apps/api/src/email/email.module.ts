import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma.module';
import { StorageService } from '../storage/storage.service';
import { PdfService } from './pdf.service';
import { EmailReminderScheduler } from './email-reminder.scheduler';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, PdfService, StorageService, EmailReminderScheduler],
  exports: [EmailService],
})
export class EmailModule {}
