import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Hot store: current vehicle state per vehicle_id (SoC, last reading).
 * UPSERT by vehicle_id for dashboard "current battery %" without scanning history.
 */
@Entity('vehicle_readings_live')
export class VehicleReadingLive {
  @PrimaryColumn({ type: 'varchar', length: 64, name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'soc' })
  soc: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'kwh_delivered_dc' })
  kwhDeliveredDc: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'battery_temp' })
  batteryTemp: string | null;

  @Column({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
