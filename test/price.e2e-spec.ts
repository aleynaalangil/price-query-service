import { Test, TestingModule } from '@nestjs/testing';
import { PriceController } from '../src/price/price.controller';
import { PriceService } from '../src/price/price.service';
import { PriceQueueService } from '../src/price/price-queue.service';
import { PriceRecord } from '../src/entities/price-record.entity';

describe('Price API (e2e)', () => {
  let controller: PriceController;
  let priceService: { findHistory: jest.Mock };
  let priceQueueService: { getPrice: jest.Mock };

  beforeAll(async () => {
    priceService = {
      findHistory: jest.fn(),
    };
    priceQueueService = {
      getPrice: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PriceController],
      providers: [
        { provide: PriceService, useValue: priceService },
        { provide: PriceQueueService, useValue: priceQueueService },
      ],
    }).compile();

    controller = moduleFixture.get<PriceController>(PriceController);
  });

  beforeEach(() => {
    priceService.findHistory.mockReset();
    priceQueueService.getPrice.mockReset();
  });

  it('returns the current price payload', async () => {
    priceQueueService.getPrice.mockResolvedValue(50000);

    const body = await controller.getPrice({ coinId: 'bitcoin' });
    expect(body).toMatchObject({
      coinId: 'bitcoin',
      price: 50000,
      currency: 'usd',
    });
    expect(body.timestamp).toBeDefined();
    expect(priceQueueService.getPrice).toHaveBeenCalledWith('bitcoin');
  });

  it('returns the historical payload', async () => {
    const history: PriceRecord[] = [
      {
        id: 1,
        symbol: 'bitcoin',
        price: 50000,
        lastUpdate: new Date('2026-03-02T12:00:00.000Z'),
      },
    ];
    priceService.findHistory.mockResolvedValue(history);

    const body = await controller.getHistory({ coinId: 'bitcoin' });
    expect(body.coinId).toBe('bitcoin');
    expect(body.history).toHaveLength(1);
    expect(priceService.findHistory).toHaveBeenCalledWith('bitcoin');
  });
});
