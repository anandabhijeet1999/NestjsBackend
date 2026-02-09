import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TelemetryService } from './telemetry.service';
import { MeterReadingHistory } from '../database/entities/meter-reading-history.entity';
import { MeterReadingLive } from '../database/entities/meter-reading-live.entity';
import { VehicleReadingHistory } from '../database/entities/vehicle-reading-history.entity';
import { VehicleReadingLive } from '../database/entities/vehicle-reading-live.entity';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let dataSource: DataSource;

  const mockTx = {
    getRepository: jest.fn().mockReturnValue({
      save: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(undefined),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: DataSource,
          useValue: { transaction: jest.fn((fn) => fn(mockTx)) },
        },
        { provide: getRepositoryToken(MeterReadingHistory), useValue: { create: jest.fn((o) => o) } },
        { provide: getRepositoryToken(MeterReadingLive), useValue: {} },
        { provide: getRepositoryToken(VehicleReadingHistory), useValue: { create: jest.fn((o) => o) } },
        { provide: getRepositoryToken(VehicleReadingLive), useValue: {} },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestMeter', () => {
    it('should INSERT into history and UPSERT live', async () => {
      const dto = {
        meterId: 'M001',
        kwhConsumedAc: 12.5,
        voltage: 240,
        timestamp: '2025-01-15T12:00:00Z',
      };
      await service.ingestMeter(dto);
      expect(dataSource.transaction).toHaveBeenCalled();
      const repo = mockTx.getRepository();
      expect(repo.save).toHaveBeenCalled();
      expect(repo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          meterId: 'M001',
          kwhConsumedAc: '12.5',
          voltage: '240',
        }),
        { conflictPaths: ['meterId'], skipUpdateIfNoValuesChanged: true },
      );
    });
  });

  describe('ingestVehicle', () => {
    it('should INSERT into history and UPSERT live', async () => {
      const dto = {
        vehicleId: 'V001',
        soc: 85,
        kwhDeliveredDc: 10.2,
        batteryTemp: 28.5,
        timestamp: '2025-01-15T12:00:00Z',
      };
      await service.ingestVehicle(dto);
      expect(dataSource.transaction).toHaveBeenCalled();
      const repo = mockTx.getRepository();
      expect(repo.save).toHaveBeenCalled();
      expect(repo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'V001',
          soc: '85',
          kwhDeliveredDc: '10.2',
          batteryTemp: '28.5',
        }),
        { conflictPaths: ['vehicleId'], skipUpdateIfNoValuesChanged: true },
      );
    });
  });
});
