import { Inject, Injectable, Logger } from '@nestjs/common';
import { PriceRecord } from '../entities/price-record.entity';
import { PriceResult } from './dto/price-result.dto';
import { IPriceProvider } from './interfaces/price-provider.interface';
import { PriceRepository } from './price.repository';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(
    private readonly priceRepository: PriceRepository,
    @Inject(IPriceProvider)
    private readonly priceProvider: IPriceProvider,
  ) {}

  async fetchAndSaveBatch(coinIds: string[]): Promise<PriceResult[]> {
    const uniqueIds = [...new Set(coinIds)];
    this.logger.log(`Fetching unique ids ${uniqueIds.length} items`);
    const results = await this.priceProvider.fetchPrices(uniqueIds);
    for (const result of results) {
      await this.priceRepository.savePrice(result.coinId, result.price);
    }
    return results;
  }

  async findHistory(coinId: string): Promise<PriceRecord[]> {
    return this.priceRepository.findHistory(coinId);
  }
}
