import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';
import { MeterReadingHistory } from '../database/entities/meter-reading-history.entity';
import { VehicleReadingHistory } from '../database/entities/vehicle-reading-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleMeterMapping,
      MeterReadingHistory,
      VehicleReadingHistory,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
