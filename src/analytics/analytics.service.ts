import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';
import { MeterReadingHistory } from '../database/entities/meter-reading-history.entity';
import { VehicleReadingHistory } from '../database/entities/vehicle-reading-history.entity';

export interface PerformanceSummary {
  vehicleId: string;
  meterId: string | null;
  window: { from: string; to: string };
  kwhConsumedAc: number;
  kwhDeliveredDc: number;
  efficiencyRatio: number | null;
  avgBatteryTemp: number | null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(VehicleMeterMapping)
    private readonly mappingRepo: Repository<VehicleMeterMapping>,
    @InjectRepository(MeterReadingHistory)
    private readonly meterHistoryRepo: Repository<MeterReadingHistory>,
    @InjectRepository(VehicleReadingHistory)
    private readonly vehicleHistoryRepo: Repository<VehicleReadingHistory>,
  ) {}

  /**
   * Returns 24-hour performance summary for a vehicle.
   * Uses indexed range scans on (vehicle_id, timestamp) and (meter_id, timestamp)
   * to avoid full table scan.
   */
  async getPerformance24h(vehicleId: string): Promise<PerformanceSummary> {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const mapping = await this.mappingRepo.findOne({ where: { vehicleId } });
    const meterId = mapping?.meterId ?? null;

    const [vehicleRows, meterRows] = await Promise.all([
      this.vehicleHistoryRepo
        .createQueryBuilder('v')
        .select(
          'COALESCE(SUM(v."kwh_delivered_dc"::numeric), 0)::float',
          'kwhDeliveredDc',
        )
        .addSelect(
          'AVG(v."battery_temp"::numeric)::float',
          'avgBatteryTemp',
        )
        .where('v.vehicle_id = :vehicleId', { vehicleId })
        .andWhere('v.timestamp >= :from', { from })
        .andWhere('v.timestamp <= :to', { to: now })
        .getRawOne(),
      meterId
        ? this.meterHistoryRepo
            .createQueryBuilder('m')
            .select(
              'COALESCE(SUM(m."kwh_consumed_ac"::numeric), 0)::float',
              'kwhConsumedAc',
            )
            .where('m.meter_id = :meterId', { meterId })
            .andWhere('m.timestamp >= :from', { from })
            .andWhere('m.timestamp <= :to', { to: now })
            .getRawOne()
        : Promise.resolve({ kwhConsumedAc: 0 }),
    ]);

    const kwhDeliveredDc = Number(vehicleRows?.kwhDeliveredDc ?? 0);
    const kwhConsumedAc = Number(
      meterId ? (meterRows as { kwhConsumedAc: number }).kwhConsumedAc : 0,
    );
    const avgBatteryTemp =
      vehicleRows?.avgBatteryTemp != null
        ? Number(vehicleRows.avgBatteryTemp)
        : null;

    const efficiencyRatio =
      kwhConsumedAc > 0 ? kwhDeliveredDc / kwhConsumedAc : null;

    return {
      vehicleId,
      meterId,
      window: { from: from.toISOString(), to: now.toISOString() },
      kwhConsumedAc,
      kwhDeliveredDc,
      efficiencyRatio,
      avgBatteryTemp,
    };
  }

  async setVehicleMeterMapping(
    vehicleId: string,
    meterId: string,
  ): Promise<{ vehicleId: string; meterId: string }> {
    await this.mappingRepo.upsert(
      { vehicleId, meterId },
      { conflictPaths: ['vehicleId'], skipUpdateIfNoValuesChanged: true },
    );
    return { vehicleId, meterId };
  }
}
