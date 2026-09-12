import { Type } from 'class-transformer';
import { BankTransactionDirection } from '@prisma/client';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBankTransactionDto {
  @IsString()
  paymentAccountId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(BankTransactionDirection)
  direction!: BankTransactionDirection;

  @IsOptional()
  @IsString()
  currency?: string;

  @Type(() => Date)
  @IsDate()
  transactionDate!: Date;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}
