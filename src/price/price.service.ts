import { Inject, Injectable, Logger } from '@nestjs/common';
import { PriceRecord } from '../entities/price-record.entity';
import { PriceQueueService } from './price-queue.service';
import { IPriceProvider } from './interfaces/price-provider.interface';
import { PriceRepository } from './price.repository';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(
    private readonly priceRepository: PriceRepository,
    private readonly priceQueueService: PriceQueueService,
    @Inject(IPriceProvider)
    private readonly priceProvider: IPriceProvider,
  ) {}

  async getPrice(coinId: string): Promise<number> {
    return this.priceQueueService.getPrice(coinId, async (id) => {
      const price = await this.priceProvider.fetchPrice(id);
      await this.priceRepository.savePrice(id, price);
      return price;
    });
  }

  async findHistory(coinId: string): Promise<PriceRecord[]> {
    return this.priceRepository.findHistory(coinId);
  }
}
