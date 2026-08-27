import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from '../address/create-address.dto';
import { CreateCustomerDto } from '../customer/create-customer.dto';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;

  @IsString()
  title!: string;

  @IsString()
  issueDate!: string;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  workOrderReference?: string;

  @IsOptional()
  @IsString()
  workOrderTitle?: string;

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
  tenantSirenNumber!: string;

  @IsString()
  tenantCountryCode!: string;

  @IsString()
  tenantVatNumber!: string;

  @IsString()
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
  customerName!: string;

  @IsString()
  customerCountryCode!: string;

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
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhoneNumber?: string;

  @IsOptional()
  @IsString()
  customerVatNumber?: string;

  @IsOptional()
  @IsString()
  workOrderStartDate?: string;

  @IsOptional()
  @IsString()
  workOrderEndDate?: string;

  @IsOptional()
  @IsString()
  workOrderAddressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  workOrderAddress?: CreateAddressDto;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @IsOptional()
  @IsString()
  currency?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total?: number;

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  pdfFileId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  quoteItems!: CreateQuoteItemDto[];
}