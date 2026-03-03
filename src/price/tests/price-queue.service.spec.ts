jest.mock('uuidv4', () => ({
  uuid: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { uuid } from 'uuidv4';
import { PRICE_QUEUE_NAME } from '../constants';
import { PriceQueueService } from '../price-queue.service';
import { BatchTimeoutException } from '../../common/exceptions/batch-timeout.exception';

describe('PriceQueueService', () => {
  let service: PriceQueueService;
  let mockQueue: { add: jest.Mock };
  let eventEmitter: EventEmitter2;
  let mockUuid: jest.MockedFunction<typeof uuid>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter = new EventEmitter2();
    mockUuid = uuid as jest.MockedFunction<typeof uuid>;
    mockUuid.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceQueueService,
        { provide: getQueueToken(PRICE_QUEUE_NAME), useValue: mockQueue },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<PriceQueueService>(PriceQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('queues a fetch request and resolves when the matching event arrives', async () => {
    mockUuid.mockReturnValue('request-1');

    const resultPromise = service.getPrice('bitcoin');

    expect(mockQueue.add).toHaveBeenCalledWith(
      'fetch-price',
      {
        coinId: 'bitcoin',
        requestId: 'request-1',
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    await Promise.resolve();
    eventEmitter.emit('price.result.request-1', 50000);

    await expect(resultPromise).resolves.toBe(50000);
  });

  it('keeps concurrent requests isolated by request id', async () => {
    mockUuid.mockReturnValueOnce('request-1').mockReturnValueOnce('request-2');

    const firstResult = service.getPrice('bitcoin');
    const secondResult = service.getPrice('ethereum');

    expect(mockQueue.add).toHaveBeenNthCalledWith(
      1,
      'fetch-price',
      {
        coinId: 'bitcoin',
        requestId: 'request-1',
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    expect(mockQueue.add).toHaveBeenNthCalledWith(
      2,
      'fetch-price',
      {
        coinId: 'ethereum',
        requestId: 'request-2',
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    await Promise.resolve();
    eventEmitter.emit('price.result.request-2', 2500);
    eventEmitter.emit('price.result.request-1', 50000);

    await expect(secondResult).resolves.toBe(2500);
    await expect(firstResult).resolves.toBe(50000);
  });

  it('rejects when the event emits an Error object', async () => {
    mockUuid.mockReturnValue('request-err');

    const resultPromise = service.getPrice('bitcoin');

    await Promise.resolve();
    eventEmitter.emit('price.result.request-err', new Error('Price not found'));

    await expect(resultPromise).rejects.toThrow('Price not found');
  });

  it('rejects with BatchTimeoutException after 30 seconds', async () => {
    jest.useFakeTimers();
    mockUuid.mockReturnValue('request-timeout');

    const resultPromise = service.getPrice('bitcoin');

    // Flush the microtask queue so the awaited priceQueue.add() resolves
    // and the setTimeout inside getPrice is registered
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(30000);

    await expect(resultPromise).rejects.toBeInstanceOf(BatchTimeoutException);

    jest.useRealTimers();
  });

  it('cleans up event listener after successful resolve', async () => {
    mockUuid.mockReturnValue('request-cleanup');

    const resultPromise = service.getPrice('bitcoin');

    await Promise.resolve();
    eventEmitter.emit('price.result.request-cleanup', 50000);

    await resultPromise;
    expect(eventEmitter.listenerCount('price.result.request-cleanup')).toBe(0);
  });

  it('cleans up event listener after timeout', async () => {
    jest.useFakeTimers();
    mockUuid.mockReturnValue('request-cleanup-timeout');

    const resultPromise = service.getPrice('bitcoin');

    // Flush the microtask queue so the awaited priceQueue.add() resolves
    // and the setTimeout inside getPrice is registered
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(30000);

    await expect(resultPromise).rejects.toThrow();
    expect(
      eventEmitter.listenerCount('price.result.request-cleanup-timeout'),
    ).toBe(0);

    jest.useRealTimers();
  });
});
