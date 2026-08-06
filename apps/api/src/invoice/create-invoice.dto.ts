import {
  InvoicePdpStatus,
  InvoiceStatus,
  PaymentMethod,
} from '@prisma/client';
import {
  IsDate,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsString()
  number!: string;

  @IsDate({ message: 'issueDate must be a date' })
  issueDate!: Date;

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

  @IsString()
  tenantSiretNumber!: string;

  @IsString()
  tenantVatNumber!: string;

  @IsEmail()
  tenantEmail!: string;

  @IsString()
  tenantPhoneNumber!: string;

  @IsOptional()
  @IsString()
  tenantIban?: string;

  @IsOptional()
  @IsString()
  tenantBic?: string;

  @IsString()
  customerFirstName!: string;

  @IsString()
  customerLastName!: string;

  @IsString()
  customerStreet1!: string;

  @IsOptional()
  @IsString()
  customerStreet2?: string;

  @IsString()
  customerPostalCode!: string;

  @IsString()
  customerCity!: string;

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

  @IsDecimal()
  subtotal!: number;

  @IsDecimal()
  vatAmount!: number;

  @IsDecimal()
  total!: number;

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
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

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
}
