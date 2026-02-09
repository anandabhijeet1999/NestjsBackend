import { IsIn } from 'class-validator';

/**
 * Polymorphic ingestion: body has type discriminator plus fields for that type.
 * type: 'meter' -> meterId, kwhConsumedAc, voltage, timestamp
 * type: 'vehicle' -> vehicleId, soc, kwhDeliveredDc, batteryTemp?, timestamp
 * Validation of the rest is done in controller via MeterTelemetryDto or VehicleTelemetryDto.
 */
export class IngestBodyDto {
  @IsIn(['meter', 'vehicle'], {
    message: 'type must be either "meter" or "vehicle"',
  })
  type: 'meter' | 'vehicle';
}
