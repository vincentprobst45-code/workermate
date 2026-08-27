import { LineItemType, VatCategory } from '@prisma/client';
import {
  IsNumber,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';


export class CreateWorkOrderItemDto {
  @IsEnum(LineItemType)
  type!: LineItemType;

  @IsInt()
  @Min(0)
  position!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  sellerItemIdentifier?: string;

  @IsOptional()
  @IsString()
  unitCode?: string;

  @IsOptional()
  @IsString()
  unitLabel?: string;

  @IsNumber()
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  purchaseVatRate?: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsEnum(VatCategory)
  vatCategory?: VatCategory;
}