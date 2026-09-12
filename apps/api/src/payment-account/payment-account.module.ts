import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PaymentAccountController } from './payment-account.controller';
import { PaymentAccountService } from './payment-account.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentAccountController],
  providers: [PaymentAccountService],
})
export class PaymentAccountModule {}