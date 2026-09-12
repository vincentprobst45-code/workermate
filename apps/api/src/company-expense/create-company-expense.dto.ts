import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CompanyExpenseCategory, CompanyExpenseRecurrenceUnit } from '@prisma/client';

export class CreateCompanyExpenseDto {
  @IsString()
  label!: string;

  @IsEnum(CompanyExpenseCategory)
  category!: CompanyExpenseCategory;

  @IsNumber()
  @Min(0)
  taxExclusiveAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vatAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxInclusiveAmount?: number;

  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @IsOptional()
  @IsEnum(CompanyExpenseRecurrenceUnit)
  recurrenceUnit?: CompanyExpenseRecurrenceUnit;

  @IsOptional()
  @IsNumber()
  @Min(1)
  recurrenceInterval?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  recurrenceStartDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  recurrenceEndDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueDate?: Date;

  @IsOptional()
  @IsString()
  paymentAccountId?: string;

  @IsOptional()
  @IsString()
  bankTransactionId?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
