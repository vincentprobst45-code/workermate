import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { RecurringInvoiceController } from './recurring-invoice.controller';
import { RecurringInvoiceService } from './recurring-invoice.service';

@Module({
  imports: [PrismaModule, InvoiceModule],
  controllers: [RecurringInvoiceController],
  providers: [RecurringInvoiceService],
})
export class RecurringInvoiceModule {}