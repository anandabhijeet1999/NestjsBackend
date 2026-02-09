import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MeterReadingHistory } from '../database/entities/meter-reading-history.entity';
import { MeterReadingLive } from '../database/entities/meter-reading-live.entity';
import { VehicleReadingHistory } from '../database/entities/vehicle-reading-history.entity';
import { VehicleReadingLive } from '../database/entities/vehicle-reading-live.entity';
import type { MeterTelemetryDto } from './dto/meter-telemetry.dto';
import type { VehicleTelemetryDto } from './dto/vehicle-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(MeterReadingHistory)
    private readonly meterHistoryRepo: Repository<MeterReadingHistory>,
    @InjectRepository(MeterReadingLive)
    private readonly meterLiveRepo: Repository<MeterReadingLive>,
    @InjectRepository(VehicleReadingHistory)
    private readonly vehicleHistoryRepo: Repository<VehicleReadingHistory>,
    @InjectRepository(VehicleReadingLive)
    private readonly vehicleLiveRepo: Repository<VehicleReadingLive>,
  ) {}

  async ingestMeter(dto: MeterTelemetryDto): Promise<void> {
    const ts = new Date(dto.timestamp);
    await this.dataSource.transaction(async (tx) => {
      const history = this.meterHistoryRepo.create({
        meterId: dto.meterId,
        kwhConsumedAc: String(dto.kwhConsumedAc),
        voltage: dto.voltage != null ? String(dto.voltage) : null,
        timestamp: ts,
      });
      await tx.getRepository(MeterReadingHistory).save(history);

      await tx.getRepository(MeterReadingLive).upsert(
        {
          meterId: dto.meterId,
          kwhConsumedAc: String(dto.kwhConsumedAc),
          voltage: dto.voltage != null ? String(dto.voltage) : null,
          timestamp: ts,
        },
        { conflictPaths: ['meterId'], skipUpdateIfNoValuesChanged: true },
      );
    });
  }

  async ingestVehicle(dto: VehicleTelemetryDto): Promise<void> {
    const ts = new Date(dto.timestamp);
    await this.dataSource.transaction(async (tx) => {
      const history = this.vehicleHistoryRepo.create({
        vehicleId: dto.vehicleId,
        soc: String(dto.soc),
        kwhDeliveredDc: String(dto.kwhDeliveredDc),
        batteryTemp:
          dto.batteryTemp != null ? String(dto.batteryTemp) : null,
        timestamp: ts,
      });
      await tx.getRepository(VehicleReadingHistory).save(history);

      await tx.getRepository(VehicleReadingLive).upsert(
        {
          vehicleId: dto.vehicleId,
          soc: String(dto.soc),
          kwhDeliveredDc: String(dto.kwhDeliveredDc),
          batteryTemp:
            dto.batteryTemp != null ? String(dto.batteryTemp) : null,
          timestamp: ts,
        },
        { conflictPaths: ['vehicleId'], skipUpdateIfNoValuesChanged: true },
      );
    });
  }
}
