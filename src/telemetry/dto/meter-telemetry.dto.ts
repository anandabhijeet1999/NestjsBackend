import { IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MeterTelemetryDto {
  @IsString()
  meterId: string;

  @IsNumber()
  @Min(0, { message: 'kwhConsumedAc must be non-negative' })
  @Type(() => Number)
  kwhConsumedAc: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @Type(() => Number)
  voltage: number;

  @IsDateString()
  timestamp: string;
}
