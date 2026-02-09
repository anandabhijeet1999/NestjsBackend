import {
  IsString,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VehicleTelemetryDto {
  @IsString()
  vehicleId: string;

  @IsNumber()
  @Min(0, { message: 'soc must be 0-100' })
  @Max(100, { message: 'soc must be 0-100' })
  @Type(() => Number)
  soc: number;

  @IsNumber()
  @Min(0, { message: 'kwhDeliveredDc must be non-negative' })
  @Type(() => Number)
  kwhDeliveredDc: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  batteryTemp?: number;

  @IsDateString()
  timestamp: string;
}
