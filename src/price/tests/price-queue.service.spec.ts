jest.mock('uuidv4', () => ({
  uuid: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { uuid } from 'uuidv4';
import { PriceQueueService } from '../price-queue.service';

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
        { provide: getQueueToken('price-queries'), useValue: mockQueue },
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
});
