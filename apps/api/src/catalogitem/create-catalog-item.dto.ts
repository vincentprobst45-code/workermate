import { Type } from 'class-transformer';
import { LineItemType, VatCategory } from '@prisma/client';
import {
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCatalogItemDto {
  @IsEnum(LineItemType)
  type!: LineItemType;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultQuantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  unitCode?: string;

  @IsOptional()
  @IsString()
  unitLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseQuantity?: number;

  @IsOptional()
  @IsString()
  baseQuantityUnitCode?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseVatRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @IsOptional()
  @IsEnum(VatCategory)
  vatCategory?: VatCategory;
}
