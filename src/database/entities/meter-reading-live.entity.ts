import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Hot store: current/latest meter state per meter_id.
 * UPSERT by meter_id so dashboards read one row per meter.
 */
@Entity('meter_readings_live')
export class MeterReadingLive {
  @PrimaryColumn({ type: 'varchar', length: 64, name: 'meter_id' })
  meterId: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'kwh_consumed_ac' })
  kwhConsumedAc: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'voltage' })
  voltage: string | null;

  @Column({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
