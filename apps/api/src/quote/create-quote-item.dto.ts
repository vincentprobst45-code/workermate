import { Type } from 'class-transformer';
import { WorkOrderItemType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuoteItemDto {
  @IsOptional()
  @IsEnum(WorkOrderItemType)
  type?: WorkOrderItemType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  position!: number;

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

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatRate!: number;
}