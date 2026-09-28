import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, InvoiceModule, EmailModule],
  providers: [QuoteService],
  controllers: [QuoteController],
})
export class QuoteModule {}