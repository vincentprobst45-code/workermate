import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { BankTransactionController } from './bank-transaction.controller';
import { BankTransactionService } from './bank-transaction.service';

@Module({
  imports: [PrismaModule],
  controllers: [BankTransactionController],
  providers: [BankTransactionService],
})
export class BankTransactionModule {}
