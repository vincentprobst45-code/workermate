import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum ForecastPaymentTiming {
  GENERATION = 'GENERATION',
  DUE_DATE = 'DUE_DATE',
  ARBITRARY_DAYS = 'ARBITRARY_DAYS',
}

export class ForecastQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(730)
  horizonDays = 90;

  @IsOptional()
  @IsEnum(ForecastPaymentTiming)
  paymentTiming = ForecastPaymentTiming.DUE_DATE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(730)
  paymentDelayDays = 0;

  @IsOptional()
  paymentAccountId?: string;
}
