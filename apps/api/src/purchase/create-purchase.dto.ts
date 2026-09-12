import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { LineItemType, PurchaseStatus } from '@prisma/client';

export class CreatePurchaseItemDto {
  @IsOptional() @IsString() catalogItemId?: string;
  @IsOptional() @IsIn(['NEW', 'EXISTING']) catalogItemMode?: 'NEW' | 'EXISTING';
  @IsEnum(LineItemType) type!: LineItemType;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) quantity!: number;
  @IsString() unitCode!: string;
  @IsOptional() @IsString() unitLabel?: string;
  @IsOptional() @IsNumber() @Min(0) baseQuantity?: number;
  @IsOptional() @IsString() baseQuantityUnitCode?: string;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsNumber() @Min(0) taxExclusiveAmount!: number;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsNumber() @Min(0) vatAmount?: number;
  @IsOptional() @IsNumber() @Min(0) deductibleVatAmount?: number;
  @IsNumber() @Min(0) taxInclusiveAmount!: number;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() workOrderId?: string;
  @IsOptional() @IsBoolean() addToStock?: boolean;
}

export class CreatePurchaseDto {
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsString() supplierName?: string;
  @IsOptional() @IsString() label?: string;
  @Type(() => Date) @IsDate() purchaseDate!: Date;
  @IsOptional() @IsEnum(PurchaseStatus) status?: PurchaseStatus;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() taxExclusiveAmount?: number;
  @IsOptional() @IsNumber() vatAmount?: number;
  @IsNumber() @Min(0) taxInclusiveAmount!: number;
  @IsOptional() @IsNumber() deductibleVatAmount?: number;
  @IsOptional() @Type(() => Date) @IsDate() paidAt?: Date;
  @IsOptional() @Type(() => Date) @IsDate() dueDate?: Date;
  @IsOptional() @IsString() paymentAccountId?: string;
  @IsOptional() @IsString() bankTransactionId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => CreatePurchaseItemDto) items?: CreatePurchaseItemDto[];
}
