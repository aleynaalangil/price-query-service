import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { PriceProcessor } from '../price-processor.service';
import { PriceService } from '../price.service';

describe('PriceProcessor', () => {
  let service: PriceProcessor;
  let mockEventEmitter: { emit: jest.Mock<void, [string, number | Error]> };
  let mockPriceService: {
    fetchAndSaveBatch: jest.Mock<Promise<Record<string, number>>, [string[]]>;
  };

  const createJob = (
    coinId: string,
    requestId: string,
  ): Job<{ coinId: string; requestId: string }> =>
    ({
      data: { coinId, requestId },
    }) as Job<{ coinId: string; requestId: string }>;

  beforeEach(async () => {
    jest.useFakeTimers();

    mockEventEmitter = {
      emit: jest.fn(),
    };
    mockPriceService = {
      fetchAndSaveBatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceProcessor,
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PriceService, useValue: mockPriceService },
      ],
    }).compile();

    service = module.get<PriceProcessor>(PriceProcessor);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('holds requests below the threshold until the 5 second window ends', async () => {
    mockPriceService.fetchAndSaveBatch.mockResolvedValue({ bitcoin: 50000 });

    await service.process(createJob('bitcoin', 'request-1'));
    await service.process(createJob('bitcoin', 'request-2'));

    expect(mockPriceService.fetchAndSaveBatch).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(4999);

    expect(mockPriceService.fetchAndSaveBatch).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);

    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenCalledWith([
      'bitcoin',
    ]);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      1,
      'price.result.request-1',
      50000,
    );
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      'price.result.request-2',
      50000,
    );
  });

  it('flushes immediately when the pending request threshold reaches 3', async () => {
    mockPriceService.fetchAndSaveBatch.mockResolvedValue({ bitcoin: 50000 });

    await service.process(createJob('bitcoin', 'request-1'));
    await service.process(createJob('bitcoin', 'request-2'));
    await service.process(createJob('bitcoin', 'request-3'));

    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenCalledTimes(1);
    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenCalledWith([
      'bitcoin',
    ]);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(3);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      1,
      'price.result.request-1',
      50000,
    );
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      'price.result.request-2',
      50000,
    );
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      3,
      'price.result.request-3',
      50000,
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenCalledTimes(1);
  });

  it('keeps batches isolated by coin when one coin reaches the threshold', async () => {
    mockPriceService.fetchAndSaveBatch.mockImplementation(async ([coinId]) => ({
      [coinId]: coinId === 'bitcoin' ? 50000 : 3000,
    }));

    await service.process(createJob('ethereum', 'eth-1'));
    await service.process(createJob('bitcoin', 'btc-1'));
    await service.process(createJob('ethereum', 'eth-2'));
    await service.process(createJob('bitcoin', 'btc-2'));
    await service.process(createJob('bitcoin', 'btc-3'));

    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenCalledTimes(1);
    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenNthCalledWith(1, [
      'bitcoin',
    ]);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(3);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      1,
      'price.result.btc-1',
      50000,
    );
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      'price.result.btc-2',
      50000,
    );
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      3,
      'price.result.btc-3',
      50000,
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenCalledTimes(2);
    expect(mockPriceService.fetchAndSaveBatch).toHaveBeenNthCalledWith(2, [
      'ethereum',
    ]);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      4,
      'price.result.eth-1',
      3000,
    );
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(
      5,
      'price.result.eth-2',
      3000,
    );
  });
});
