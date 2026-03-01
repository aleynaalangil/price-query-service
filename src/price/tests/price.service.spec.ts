import { Test, TestingModule } from '@nestjs/testing';
import { PriceService } from '../price.service';
import { PriceRepository } from '../price.repository';
import { PriceQueueService } from '../price-queue.service';
import { IPriceProvider } from '../interfaces/price-provider.interface';

describe('PriceService', () => {
  let service: PriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceService,
        { provide: PriceRepository, useValue: {} },
        { provide: PriceQueueService, useValue: {} },
        { provide: IPriceProvider, useValue: {} },
      ],
    }).compile();

    service = module.get<PriceService>(PriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
