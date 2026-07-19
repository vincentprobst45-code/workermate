import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from '../address/create-address.dto';

export class CreateCustomerDto {
  // Identité
  @IsOptional()
  @IsString({ message: 'firstName must be a string' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'lastName must be a string' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'company must be a string' })
  company?: string;

  // Contact
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'mobile must be a string' })
  mobile?: string;

  // Adresse existante
  @IsOptional()
  @IsString({ message: 'addressId must be a string' })
  addressId?: string;

  // Nouvelle adresse
  @IsOptional()
  @ValidateNested({ message: 'address must be a valid object' })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  // Professionnels
  @IsOptional()
  @IsString({ message: 'siret must be a string' })
  siret?: string;

  @IsOptional()
  @IsString({ message: 'vatNumber must be a string' })
  vatNumber?: string;

  // Divers
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}