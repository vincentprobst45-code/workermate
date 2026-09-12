import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { LineItemType, SupplierInvoiceKind, SupplierInvoiceStatus } from '@prisma/client';

export class CreateSupplierInvoiceItemDto {
  @IsString() title!: string;
  @IsOptional() @IsEnum(LineItemType) type?: LineItemType;
  @IsOptional() @IsString() lineIdentifier?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsOptional() @IsString() unitCode?: string;
  @IsOptional() @IsString() unitLabel?: string;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsNumber() @Min(0) taxExclusiveAmount!: number;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsNumber() @Min(0) vatAmount?: number;
  @IsOptional() @IsNumber() @Min(0) deductibleVatAmount?: number;
  @IsNumber() @Min(0) taxInclusiveAmount!: number;
}

export class CreateSupplierInvoiceDto {
  @IsString() supplierId!: string;
  @IsOptional() @IsEnum(SupplierInvoiceKind) kind?: SupplierInvoiceKind;
  @IsOptional() @IsEnum(SupplierInvoiceStatus) status?: SupplierInvoiceStatus;
  @IsString() supplierInvoiceNumber!: string;
  @Type(() => Date) @IsDate() issueDate!: Date;
  @IsOptional() @Type(() => Date) @IsDate() receivedDate?: Date;
  @IsOptional() @Type(() => Date) @IsDate() dueDate?: Date;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) lineNetTotal?: number;
  @IsOptional() @IsNumber() @Min(0) allowanceTotal?: number;
  @IsOptional() @IsNumber() @Min(0) chargeTotal?: number;
  @IsNumber() @Min(0) taxExclusiveAmount!: number;
  @IsOptional() @IsNumber() @Min(0) vatAmount?: number;
  @IsNumber() @Min(0) taxInclusiveAmount!: number;
  @IsOptional() @IsNumber() @Min(0) deductibleVatAmount?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => CreateSupplierInvoiceItemDto) items?: CreateSupplierInvoiceItemDto[];
}
