import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CompanyExpenseController } from './company-expense.controller';
import { CompanyExpenseService } from './company-expense.service';
import { CompanyExpenseScheduler } from './company-expense.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyExpenseController],
  providers: [CompanyExpenseService, CompanyExpenseScheduler],
})
export class CompanyExpenseModule {}
