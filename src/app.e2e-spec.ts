import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { TelemetryService } from './telemetry/telemetry.service';
import { AnalyticsService } from './analytics/analytics.service';

describe('API (e2e)', () => {
  let app: INestApplication;

  const mockTelemetryService = {
    ingestMeter: jest.fn().mockResolvedValue(undefined),
    ingestVehicle: jest.fn().mockResolvedValue(undefined),
  };
  const mockAnalyticsService = {
    getPerformance24h: jest.fn().mockResolvedValue({
      vehicleId: 'V001',
      meterId: 'M001',
      window: { from: '2025-01-14T12:00:00.000Z', to: '2025-01-15T12:00:00.000Z' },
      kwhConsumedAc: 100,
      kwhDeliveredDc: 88,
      efficiencyRatio: 0.88,
      avgBatteryTemp: 26.5,
    }),
    setVehicleMeterMapping: jest.fn().mockResolvedValue({ vehicleId: 'V001', meterId: 'M001' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TelemetryService)
      .useValue(mockTelemetryService)
      .overrideProvider(AnalyticsService)
      .useValue(mockAnalyticsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/telemetry/ingest', () => {
    it('should accept meter payload and return 201/200', async () => {
      const body = {
        type: 'meter',
        meterId: 'M001',
        kwhConsumedAc: 12.5,
        voltage: 240,
        timestamp: '2025-01-15T12:00:00Z',
      };
      const res = await request(app.getHttpServer())
        .post('/v1/telemetry/ingest')
        .send(body)
        .expect(200);
      expect(res.body).toEqual({ ok: true });
      expect(mockTelemetryService.ingestMeter).toHaveBeenCalledWith(
        expect.objectContaining({
          meterId: 'M001',
          kwhConsumedAc: 12.5,
          voltage: 240,
        }),
      );
    });

    it('should accept vehicle payload and return 201/200', async () => {
      const body = {
        type: 'vehicle',
        vehicleId: 'V001',
        soc: 85,
        kwhDeliveredDc: 10.2,
        batteryTemp: 28.5,
        timestamp: '2025-01-15T12:00:00Z',
      };
      const res = await request(app.getHttpServer())
        .post('/v1/telemetry/ingest')
        .send(body)
        .expect(200);
      expect(res.body).toEqual({ ok: true });
      expect(mockTelemetryService.ingestVehicle).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'V001',
          soc: 85,
          kwhDeliveredDc: 10.2,
        }),
      );
    });

    it('should reject invalid type with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/telemetry/ingest')
        .send({ type: 'invalid' })
        .expect(400);
      expect(mockTelemetryService.ingestMeter).not.toHaveBeenCalled();
      expect(mockTelemetryService.ingestVehicle).not.toHaveBeenCalled();
    });

    it('should reject meter payload with missing required fields with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/telemetry/ingest')
        .send({
          type: 'meter',
          meterId: 'M001',
          // missing kwhConsumedAc, voltage, timestamp
        })
        .expect(400);
    });

    it('should reject vehicle payload with soc out of range with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/telemetry/ingest')
        .send({
          type: 'vehicle',
          vehicleId: 'V001',
          soc: 150,
          kwhDeliveredDc: 10,
          timestamp: '2025-01-15T12:00:00Z',
        })
        .expect(400);
    });
  });

  describe('GET /v1/analytics/performance/:vehicleId', () => {
    it('should return 24h performance summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/analytics/performance/V001')
        .expect(200);
      expect(res.body.vehicleId).toBe('V001');
      expect(res.body.kwhConsumedAc).toBe(100);
      expect(res.body.kwhDeliveredDc).toBe(88);
      expect(res.body.efficiencyRatio).toBe(0.88);
      expect(mockAnalyticsService.getPerformance24h).toHaveBeenCalledWith('V001');
    });
  });

  describe('POST /v1/analytics/vehicle-mapping', () => {
    it('should register vehicle-meter mapping', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analytics/vehicle-mapping')
        .send({ vehicleId: 'V001', meterId: 'M001' })
        .expect(200);
      expect(res.body).toEqual({ vehicleId: 'V001', meterId: 'M001' });
      expect(mockAnalyticsService.setVehicleMeterMapping).toHaveBeenCalledWith('V001', 'M001');
    });
  });
});
