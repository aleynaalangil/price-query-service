import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { uuid } from 'uuidv4';

@Injectable()
export class PriceQueueService {
  constructor(
    @InjectQueue('price-queries') private readonly priceQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async getPrice(coinId: string): Promise<number> {
    const requestId = uuid();
    await this.priceQueue.add(
      'fetch-price',
      { coinId, requestId },
      { removeOnComplete: true, removeOnFail: true },
    );

    return new Promise((resolve) => {
      this.eventEmitter.once(`price.result.${requestId}`, (price: number) => {
        resolve(price);
      });
    });
  }
}
