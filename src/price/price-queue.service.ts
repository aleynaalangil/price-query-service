import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { uuid } from 'uuidv4';
import { PRICE_QUEUE_NAME } from './constants';
import { BatchTimeoutException } from '../common/exceptions/batch-timeout.exception';

@Injectable()
export class PriceQueueService {
  private readonly TIMEOUT_MS = 30_000;

  constructor(
    @InjectQueue(PRICE_QUEUE_NAME) private readonly priceQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async getPrice(coinId: string): Promise<number> {
    const requestId = uuid();
    await this.priceQueue.add(
      'fetch-price',
      { coinId, requestId },
      { removeOnComplete: true, removeOnFail: true },
    );

    return new Promise((resolve, reject) => {
      const eventName = `price.result.${requestId}`;

      const timeout = setTimeout(() => {
        this.eventEmitter.removeListener(eventName, listener);
        reject(new BatchTimeoutException(coinId));
      }, this.TIMEOUT_MS);

      const listener = (result: number | Error) => {
        clearTimeout(timeout);
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      };

      this.eventEmitter.once(eventName, listener);
    });
  }
}
