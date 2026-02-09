import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { MeterReadingHistory } from '../database/entities/meter-reading-history.entity';
import { MeterReadingLive } from '../database/entities/meter-reading-live.entity';
import { VehicleReadingHistory } from '../database/entities/vehicle-reading-history.entity';
import { VehicleReadingLive } from '../database/entities/vehicle-reading-live.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeterReadingHistory,
      MeterReadingLive,
      VehicleReadingHistory,
      VehicleReadingLive,
    ]),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
