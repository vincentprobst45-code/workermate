import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateAddressDto } from '../address/create-address.dto';

export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() siretNumber?: string;
  @IsOptional() @IsString() vatNumber?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() bic?: string;
  @IsOptional() @IsString() logoFileId?: string;
  @IsOptional() @IsString() defaultCurrency?: string;
  @IsOptional() @IsString() defaultPaymentTerms?: string;
  @IsOptional() @IsString() defaultLegalMentions?: string;
  @IsOptional() @IsString() defaultInvoiceNotes?: string;
}
