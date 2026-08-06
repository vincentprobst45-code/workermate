import { Type } from 'class-transformer';
import { WorkOrderItemType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCatalogItemDto {
  @IsEnum(WorkOrderItemType)
  type!: WorkOrderItemType;

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

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatRate!: number;
}
