import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ProjectStatus } from '@prisma/client';
import { CreateAddressDto } from '../address/create-address.dto';
import { CreateProjectItemDto } from 'src/projectitem/create-project-item.dto';

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
  // @IsDateString()
  @IsDate({ message: 'startdate must be a date' })
  startDate?: Date;

  @IsOptional()
  // @IsDateString()
  @IsDate({ message: 'startdate must be a date' })
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectItemDto)
  projectItems?: CreateProjectItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDuration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}