import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ProjectStatus } from '@prisma/client';
import { CreateAddressDto } from '../address/create-address.dto';

export class CreateProjectDto {
  @IsString()
  customerId?: string;

  // Adresse existante
  @IsOptional()
  @IsString()
  addressId?: string;

  // Nouvelle adresse
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  // Projet
  @IsString()
  reference!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDuration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}