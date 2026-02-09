import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Links each vehicle to the meter that feeds its charger (site/circuit).
 * Required to correlate AC (meter) vs DC (vehicle) for efficiency analytics.
 */
@Entity('vehicle_meter_mapping')
export class VehicleMeterMapping {
  @PrimaryColumn({ type: 'varchar', length: 64, name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'varchar', length: 64, name: 'meter_id' })
  meterId: string;
}
