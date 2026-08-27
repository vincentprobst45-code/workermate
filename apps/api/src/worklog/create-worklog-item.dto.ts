import { LineItemType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkLogItemDto {
  @IsString()
  title!: string;

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

  @IsOptional()
  @IsString()
  unitLabel?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseQuantity?: number;

  @IsOptional()
  @IsString()
  baseQuantityUnitCode?: string;

  @IsOptional()
  @IsString()
  workOrderItemId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseVatRate?: number;

  @IsEnum(LineItemType)
  type!: LineItemType;
}