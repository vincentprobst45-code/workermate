import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export enum RecurringLineItemTypeDto {
  LABOR = 'LABOR',
  MATERIAL = 'MATERIAL',
  EQUIPMENT = 'EQUIPMENT',
  TRAVEL = 'TRAVEL',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export class RecurringInvoiceItemDto {
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsEnum(RecurringLineItemTypeDto) type!: RecurringLineItemTypeDto;
  @IsNumber() @Min(0) quantity!: number;
  @IsString() unitCode!: string;
  @IsOptional() @IsString() unitLabel?: string;
  @IsNumber() unitPrice!: number;
  @IsEnum(['STANDARD', 'REDUCED', 'ZERO', 'EXEMPT', 'OUT_OF_SCOPE']) vatCategory!: string;
  @IsOptional() @IsNumber() vatRate?: number;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateRecurringInvoiceDto {
  @IsString() name!: string;
  @IsString() customerId!: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() workOrderId?: string;
  @IsEnum(['DAY', 'WEEK', 'MONTH', 'YEAR']) recurrenceUnit!: string;
  @IsInt() @Min(1) interval!: number;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() nextOccurrenceDate?: string;
  @IsEnum(['GOODS', 'SERVICES', 'MIXED']) operationCategory!: string;
  @IsOptional() @IsEnum(['DRAFT', 'AUTO_ISSUE']) generationMode?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() paymentAccountId?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => RecurringInvoiceItemDto)
  items!: RecurringInvoiceItemDto[];
}