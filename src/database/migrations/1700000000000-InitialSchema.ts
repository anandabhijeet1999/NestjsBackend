import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "meter_readings_history" (
        "id" BIGSERIAL PRIMARY KEY,
        "meter_id" varchar(64) NOT NULL,
        "kwh_consumed_ac" decimal(12,4) NOT NULL,
        "voltage" decimal(8,2),
        "timestamp" TIMESTAMPTZ NOT NULL,
        "ingested_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_meter_history_meter_ts" ON "meter_readings_history" ("meter_id", "timestamp");
      CREATE INDEX IF NOT EXISTS "idx_meter_history_ts" ON "meter_readings_history" ("timestamp");
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "meter_readings_live" (
        "meter_id" varchar(64) PRIMARY KEY,
        "kwh_consumed_ac" decimal(12,4) NOT NULL,
        "voltage" decimal(8,2),
        "timestamp" TIMESTAMPTZ NOT NULL,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_readings_history" (
        "id" BIGSERIAL PRIMARY KEY,
        "vehicle_id" varchar(64) NOT NULL,
        "soc" decimal(5,2) NOT NULL,
        "kwh_delivered_dc" decimal(12,4) NOT NULL,
        "battery_temp" decimal(5,2),
        "timestamp" TIMESTAMPTZ NOT NULL,
        "ingested_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_vehicle_history_vehicle_ts" ON "vehicle_readings_history" ("vehicle_id", "timestamp");
      CREATE INDEX IF NOT EXISTS "idx_vehicle_history_ts" ON "vehicle_readings_history" ("timestamp");
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_readings_live" (
        "vehicle_id" varchar(64) PRIMARY KEY,
        "soc" decimal(5,2) NOT NULL,
        "kwh_delivered_dc" decimal(12,4) NOT NULL,
        "battery_temp" decimal(5,2),
        "timestamp" TIMESTAMPTZ NOT NULL,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_meter_mapping" (
        "vehicle_id" varchar(64) PRIMARY KEY,
        "meter_id" varchar(64) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_vehicle_meter_meter" ON "vehicle_meter_mapping" ("meter_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_meter_mapping"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_readings_live"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_readings_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "meter_readings_live"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "meter_readings_history"`);
  }
}
