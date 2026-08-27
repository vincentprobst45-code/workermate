import { Type } from 'class-transformer';
import { LineItemType, VatCategory } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuoteItemDto {
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
  sellerItemIdentifier?: string;

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
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsEnum(VatCategory)
  vatCategory?: VatCategory;
}