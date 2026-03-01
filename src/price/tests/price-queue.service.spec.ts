import { Test, TestingModule } from '@nestjs/testing';
import { PriceQueueService } from '../price-queue.service';

describe('PriceQueueService', () => {
  let service: PriceQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceQueueService],
    }).compile();

    service = module.get<PriceQueueService>(PriceQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should batch 3 requests and trigger fetch immediately', async () => {
    const fetchFn = jest.fn().mockResolvedValue(50000);

    const p1 = service.getPrice('bitcoin', fetchFn);
    const p2 = service.getPrice('bitcoin', fetchFn);
    const p3 = service.getPrice('bitcoin', fetchFn);

    const results = await Promise.all([p1, p2, p3]);

    expect(results).toEqual([50000, 50000, 50000]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('should wait 5 seconds if less than 3 requests', async () => {
    jest.useFakeTimers();
    const fetchFn = jest.fn().mockResolvedValue(50000);

    const p1 = service.getPrice('bitcoin', fetchFn);

    // Should not have called fetch yet
    expect(fetchFn).not.toHaveBeenCalled();

    // Advance time by 5s
    jest.advanceTimersByTime(5000);

    const result = await p1;
    expect(result).toBe(50000);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should handle multiple coins independently', async () => {
    jest.useFakeTimers();
    const fetchFn = jest
      .fn()
      .mockImplementation((id) => (id === 'bitcoin' ? 50000 : 2500));

    const p1 = service.getPrice('bitcoin', fetchFn);
    const p2 = service.getPrice('ethereum', fetchFn);

    expect(fetchFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(50000);
    expect(r2).toBe(2500);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
