import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkLogDto {
  @IsString()
  projectId!: string;

  @IsString()
  workOrderId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  timePlannedMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentMinutes?: number;
}