import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { IngestBodyDto } from './dto/ingest-request.dto';
import { MeterTelemetryDto } from './dto/meter-telemetry.dto';
import { VehicleTelemetryDto } from './dto/vehicle-telemetry.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Polymorphic ingestion: POST body must include type and the corresponding fields.
   * Meter: { type: 'meter', meterId, kwhConsumedAc, voltage, timestamp }
   * Vehicle: { type: 'vehicle', vehicleId, soc, kwhDeliveredDc, batteryTemp?, timestamp }
   */
  @Post('ingest')
  async ingest(
    @Body() body: IngestBodyDto & Record<string, unknown>,
  ): Promise<{ ok: boolean }> {
    const { type, ...payload } = body;
    if (type === 'meter') {
      const dto = plainToInstance(MeterTelemetryDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const messages = errors.flatMap((e) =>
          Object.values(e.constraints ?? {}),
        );
        throw new BadRequestException({ message: 'Validation failed', errors: messages });
      }
      await this.telemetryService.ingestMeter(dto);
    } else if (type === 'vehicle') {
      const dto = plainToInstance(VehicleTelemetryDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const messages = errors.flatMap((e) =>
          Object.values(e.constraints ?? {}),
        );
        throw new BadRequestException({ message: 'Validation failed', errors: messages });
      }
      await this.telemetryService.ingestVehicle(dto);
    } else {
      throw new BadRequestException('type must be "meter" or "vehicle"');
    }
    return { ok: true };
  }
}
