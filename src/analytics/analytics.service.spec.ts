import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';
import { MeterReadingHistory } from '../database/entities/meter-reading-history.entity';
import { VehicleReadingHistory } from '../database/entities/vehicle-reading-history.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockMappingRepo = {
    findOne: jest.fn(),
    upsert: jest.fn().mockResolvedValue(undefined),
  };
  const mockMeterHistoryRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ kwhConsumedAc: 100 }),
    })),
  };
  const mockVehicleHistoryRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        kwhDeliveredDc: 88,
        avgBatteryTemp: 26.5,
      }),
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(VehicleMeterMapping), useValue: mockMappingRepo },
        { provide: getRepositoryToken(MeterReadingHistory), useValue: mockMeterHistoryRepo },
        { provide: getRepositoryToken(VehicleReadingHistory), useValue: mockVehicleHistoryRepo },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPerformance24h', () => {
    it('should return 24h summary with efficiency when vehicle has meter mapping', async () => {
      mockMappingRepo.findOne.mockResolvedValue({ vehicleId: 'V001', meterId: 'M001' });
      const result = await service.getPerformance24h('V001');
      expect(result.vehicleId).toBe('V001');
      expect(result.meterId).toBe('M001');
      expect(result.kwhConsumedAc).toBe(100);
      expect(result.kwhDeliveredDc).toBe(88);
      expect(result.efficiencyRatio).toBeCloseTo(0.88);
      expect(result.avgBatteryTemp).toBe(26.5);
    });

    it('should return null meterId and zero AC when no mapping', async () => {
      mockMappingRepo.findOne.mockResolvedValue(null);
      mockVehicleHistoryRepo.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          kwhDeliveredDc: 50,
          avgBatteryTemp: null,
        }),
      }));
      const result = await service.getPerformance24h('V002');
      expect(result.meterId).toBeNull();
      expect(result.kwhConsumedAc).toBe(0);
      expect(result.efficiencyRatio).toBeNull();
    });
  });

  describe('setVehicleMeterMapping', () => {
    it('should upsert mapping and return vehicleId and meterId', async () => {
      const result = await service.setVehicleMeterMapping('V001', 'M001');
      expect(result).toEqual({ vehicleId: 'V001', meterId: 'M001' });
      expect(mockMappingRepo.upsert).toHaveBeenCalledWith(
        { vehicleId: 'V001', meterId: 'M001' },
        { conflictPaths: ['vehicleId'], skipUpdateIfNoValuesChanged: true },
      );
    });
  });
});
