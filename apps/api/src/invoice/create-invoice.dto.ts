import {
  InvoiceKind,
  InvoiceOperationCategory,
  InvoicePdpStatus,
  InvoiceStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
import { CreateInvoiceAdjustmentDto } from './create-invoice-adjustment.dto';
import { CreatePaymentDto } from '../payment/create-payment.dto';

export class CreateInvoiceDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsDate({ message: 'issueDate must be a date' })
  issueDate?: Date;

  @IsOptional()
  @IsDate({ message: 'dueDate must be a date' })
  dueDate?: Date;

  @IsString()
  workOrderReference!: string;

  @IsString()
  workOrderTitle!: string;

  @IsString()
  tenantName!: string;

  @IsString()
  tenantStreet1!: string;

  @IsOptional()
  @IsString()
  tenantStreet2?: string;

  @IsString()
  tenantPostalCode!: string;

  @IsString()
  tenantCity!: string;

  @IsOptional()
  @IsString()
  tenantSiretNumber?: string;

  @IsOptional()
  @IsString()
  tenantVatNumber?: string;

  @IsString()
  tenantSirenNumber!: string;

  @IsString()
  tenantCountryCode!: string;

  @IsOptional()
  @IsEmail()
  tenantEmail?: string;

  @IsOptional()
  @IsString()
  tenantPhoneNumber?: string;

  @IsOptional()
  @IsString()
  tenantIban?: string;

  @IsOptional()
  @IsString()
  tenantBic?: string;

  @IsOptional()
  @IsString()
  customerFirstName?: string;

  @IsOptional()
  @IsString()
  customerLastName?: string;

  @IsString()
  customerName!: string;

  @IsOptional()
  @IsString()
  customerStreet1?: string;

  @IsOptional()
  @IsString()
  customerStreet2?: string;

  @IsOptional()
  @IsString()
  customerPostalCode?: string;

  @IsOptional()
  @IsString()
  customerCity?: string;

  @IsString()
  customerCountryCode!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhoneNumber?: string;

  @IsOptional()
  @IsString()
  customerVatNumber?: string;

  @IsOptional()
  @IsDate({ message: 'workOrderStartDate must be a date' })
  workOrderStartDate?: Date;

  @IsOptional()
  @IsDate({ message: 'workOrderEndDate must be a date' })
  workOrderEndDate?: Date;

  @IsOptional()
  @IsString()
  workOrderAddress?: string;

  @IsOptional()
  @IsString()
  workOrderPostalCode?: string;

  @IsOptional()
  @IsString()
  workOrderCity?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(InvoiceKind)
  kind?: InvoiceKind;

  @IsOptional()
  @IsString()
  correctedInvoiceId?: string;

  @IsOptional()
  @IsString()
  referencedInvoiceId?: string;

  @IsEnum(InvoiceOperationCategory)
  operationCategory!: InvoiceOperationCategory;

  @IsOptional()
  @IsString()
  billingFrameworkCode?: string;

  @IsOptional()
  @IsString()
  accountingCurrency?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  legalMentions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDecimal()
  depositAmount?: number;

  @IsOptional()
  @IsDecimal()
  discountAmount?: number;

  @IsOptional()
  @IsDate({ message: 'paidAt must be a date' })
  paidAt?: Date;

  @IsOptional()
  @IsString()
  pdfFileId?: string;

  @IsOptional()
  @IsEnum(InvoicePdpStatus)
  pdpStatus?: InvoicePdpStatus;

  @IsOptional()
  @IsString()
  pdpMessageId?: string;

  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  quoteNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  invoiceItems?: CreateInvoiceItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceAdjustmentDto)
  adjustments?: CreateInvoiceAdjustmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments?: CreatePaymentDto[];
}
