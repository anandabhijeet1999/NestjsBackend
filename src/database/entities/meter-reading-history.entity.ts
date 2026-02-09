import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Cold store: append-only history of meter telemetry.
 * Optimized for write-heavy ingestion and time-range analytics.
 * Index on (meter_id, timestamp) avoids full table scan for range queries.
 */
@Entity('meter_readings_history')
@Index('idx_meter_history_meter_ts', ['meterId', 'timestamp'])
@Index('idx_meter_history_ts', ['timestamp'])
export class MeterReadingHistory {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'meter_id' })
  meterId: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'kwh_consumed_ac' })
  kwhConsumedAc: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'voltage' })
  voltage: string | null;

  @Column({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'ingested_at' })
  ingestedAt: Date;
}
