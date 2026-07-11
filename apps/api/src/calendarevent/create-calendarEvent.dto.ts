import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsDate,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { CreateAddressDto } from '../address/create-address.dto';

export class CreateCalendarEventDto {
  @IsString({ message: 'title must be a string' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsDate({ message: 'startdate must be a date' })
  startDate!: Date;

  @IsDate({ message: 'enddate must be a date' })
  endDate!: Date;

  @IsOptional()
  @IsString({ message: 'color must be a string' })
  color?: string;

  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;

  // Adresse existante
  @IsOptional()
  @IsUUID('4', { message: 'addressId must be a valid UUID' })
  addressId?: string;

  // Nouvelle adresse
  @IsOptional()
  @ValidateNested({ message: 'address must be a valid object' })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}