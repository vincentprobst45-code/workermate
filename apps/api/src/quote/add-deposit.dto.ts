import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, Min } from 'class-validator';

export class AddDepositDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @Type(() => Date)
  @IsDate()
  paidAt!: Date;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}