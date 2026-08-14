import { WorkOrderItemType } from '@prisma/client';
import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';


export class CreateWorkOrderItemDto {
  @IsEnum(WorkOrderItemType)
  type!: WorkOrderItemType;

  @IsInt()
  @Min(0)
  position!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDecimal()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsDecimal()
  unitPrice!: number;

  @IsOptional()
  @IsDecimal()
  unitCost?: number;

  @IsOptional()
  @IsDecimal()
  purchaseVatRate?: number;

  @IsDecimal()
  vatRate!: number;
}