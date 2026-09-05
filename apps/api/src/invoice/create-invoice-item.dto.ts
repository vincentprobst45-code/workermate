import { LineItemType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateInvoiceItemAdjustmentDto } from './create-invoice-item-adjustment.dto';

export class CreateInvoiceItemDto {
  @IsOptional()
  @IsEnum(LineItemType)
  type?: LineItemType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  position!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  lineIdentifier?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  unitCode?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatRate!: number;

  @IsOptional()
  @IsString()
  vatCategory?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemAdjustmentDto)
  adjustments?: CreateInvoiceItemAdjustmentDto[];
}