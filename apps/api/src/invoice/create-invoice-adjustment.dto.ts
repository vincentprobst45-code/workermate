import { InvoiceAdjustmentType, VatCategory } from '@prisma/client';
import { IsDecimal, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceAdjustmentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsEnum(InvoiceAdjustmentType)
  type!: InvoiceAdjustmentType;

  @IsDecimal()
  amount!: number;

  @IsOptional()
  @IsDecimal()
  baseAmount?: number;

  @IsOptional()
  @IsDecimal()
  percentage?: number;

  @IsEnum(VatCategory)
  vatCategory!: VatCategory;

  @IsOptional()
  @IsDecimal()
  vatRate?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  reasonCode?: string;
}