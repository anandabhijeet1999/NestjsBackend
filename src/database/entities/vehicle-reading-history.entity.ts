import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Cold store: append-only history of vehicle telemetry.
 * Index on (vehicle_id, timestamp) for 24h analytics without full scan.
 */
@Entity('vehicle_readings_history')
@Index('idx_vehicle_history_vehicle_ts', ['vehicleId', 'timestamp'])
@Index('idx_vehicle_history_ts', ['timestamp'])
export class VehicleReadingHistory {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'soc' })
  soc: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'kwh_delivered_dc' })
  kwhDeliveredDc: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'battery_temp' })
  batteryTemp: string | null;

  @Column({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'ingested_at' })
  ingestedAt: Date;
}
