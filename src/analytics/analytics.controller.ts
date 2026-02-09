import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AnalyticsService, PerformanceSummary } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /v1/analytics/performance/:vehicleId
   * Returns 24-hour summary: AC consumed, DC delivered, efficiency ratio, avg battery temp.
   * Uses indexed range scans (vehicle_id + timestamp, meter_id + timestamp) — no full table scan.
   */
  @Get('performance/:vehicleId')
  async getPerformance(
    @Param('vehicleId') vehicleId: string,
  ): Promise<PerformanceSummary> {
    return this.analyticsService.getPerformance24h(vehicleId);
  }

  /**
   * Register which meter feeds a vehicle's charger (for AC/DC correlation).
   * Body: { vehicleId, meterId }
   */
  @Post('vehicle-mapping')
  async setVehicleMapping(
    @Body() body: { vehicleId: string; meterId: string },
  ): Promise<{ vehicleId: string; meterId: string }> {
    return this.analyticsService.setVehicleMeterMapping(
      body.vehicleId,
      body.meterId,
    );
  }
}
