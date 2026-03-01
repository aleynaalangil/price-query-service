import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

interface PendingRequest {
  coinId: string;
  resolve: (price: number) => void;
  reject: (error: any) => void;
}

@Injectable()
export class PriceQueueService {
  private readonly logger = new Logger(PriceQueueService.name);
  private queues: Map<string, PendingRequest[]> = new Map();
  private timers: Map<string, any> = new Map();

  // to notify when a price is fetched
  private priceUpdates = new Subject<{
    coinId: string;
    price: number;
    error?: any;
  }>();

  async getPrice(
    coinId: string,
    fetchFn: (id: string) => Promise<number>,
  ): Promise<number> {
    const promise = new Promise<number>((resolve, reject) => {
      const pending = this.queues.get(coinId) || [];
      pending.push({ coinId, resolve, reject });
      this.queues.set(coinId, pending);

      this.logger.debug(
        `Request added for ${coinId}. Queue size: ${pending.length}`,
      );

      if (pending.length >= 3) {
        this.logger.log(
          `Threshold reached for ${coinId}. Triggering immediate fetch.`,
        );
        this.processQueue(coinId, fetchFn);
      } else if (pending.length === 1) {
        this.logger.log(`First request for ${coinId}. Setting 5s timer.`);
        const timeout = setTimeout(() => {
          this.logger.log(`Timer expired for ${coinId}. Processing queue.`);
          this.processQueue(coinId, fetchFn);
        }, 5000);
        this.timers.set(coinId, timeout);
      }
    });

    return promise;
  }

  private async processQueue(
    coinId: string,
    fetchFn: (id: string) => Promise<number>,
  ) {
    const queue = this.queues.get(coinId);
    if (!queue || queue.length === 0) return;

    // clear timer and queue immediately to prevent race conditions
    if (this.timers.has(coinId)) {
      clearTimeout(this.timers.get(coinId));
      this.timers.delete(coinId);
    }
    this.queues.delete(coinId);

    try {
      const price = await fetchFn(coinId);
      this.logger.log(
        `Fetched price for ${coinId}: ${price}. Responding to ${queue.length} requests.`,
      );
      queue.forEach((req) => req.resolve(price));
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${coinId}`, error);
      queue.forEach((req) => req.reject(error));
    }
  }
}
