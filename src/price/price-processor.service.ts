import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { PRICE_QUEUE_NAME } from './constants';
import { PriceService } from './price.service';
import { Logger } from '@nestjs/common';
import { PriceNotFoundException } from '../common/exceptions/price-not-found.exception';
import { ProviderUnavailableException } from '../common/exceptions/provider-unavailable.exception';

type PendingRequest = {
  requestId: string;
};

type PendingBatch = {
  requests: PendingRequest[];
  timeout: NodeJS.Timeout;
};

@Processor(PRICE_QUEUE_NAME)
export class PriceProcessor extends WorkerHost {
  private logger = new Logger(PriceProcessor.name);
  private readonly pendingBatches = new Map<string, PendingBatch>();
  private readonly waitWindowMs = 5000;
  private readonly threshold = 3;

  constructor(
    private eventEmitter: EventEmitter2,
    private priceService: PriceService,
  ) {
    super();
  }

  async process(
    job: Job<{ coinId: string; requestId: string }>,
  ): Promise<void> {
    const { coinId, requestId } = job.data;
    const batch = this.pendingBatches.get(coinId);

    if (!batch) {
      this.pendingBatches.set(coinId, {
        requests: [{ requestId }],
        timeout: setTimeout(() => {
          void this.handleTimeout(coinId);
        }, this.waitWindowMs),
      });
    } else {
      batch.requests.push({ requestId });
    }

    if (
      (this.pendingBatches.get(coinId)?.requests.length ?? 0) >= this.threshold
    ) {
      await this.flushBatch(coinId);
    }
  }

  async handleTimeout(coinId: string): Promise<void> {
    await this.flushBatch(coinId);
  }

  private async flushBatch(coinId: string): Promise<void> {
    const batch = this.pendingBatches.get(coinId);
    if (!batch) return;

    this.pendingBatches.delete(coinId);
    clearTimeout(batch.timeout);

    const requestIds = batch.requests.map((request) => request.requestId);
    try {
      const results = await this.priceService.fetchAndSaveBatch([coinId]);
      const price = results.find((r) => r.coinId === coinId)?.price;

      for (const requestId of requestIds) {
        if (price === undefined) {
          this.eventEmitter.emit(
            `price.result.${requestId}`,
            new PriceNotFoundException(coinId),
          );
          continue;
        }

        this.eventEmitter.emit(`price.result.${requestId}`, price);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processor error';
      this.logger.error(`Critical batch failure for ${coinId}: ${message}`);

      for (const requestId of requestIds) {
        this.eventEmitter.emit(
          `price.result.${requestId}`,
          error instanceof ProviderUnavailableException ||
            error instanceof PriceNotFoundException
            ? error
            : new ProviderUnavailableException(),
        );
      }
    }
  }
}
