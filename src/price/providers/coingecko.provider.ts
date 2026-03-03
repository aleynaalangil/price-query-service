import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { COINGECKO_BASE_URL } from '../constants';
import { PriceResult } from '../dto/price-result.dto';
import { IPriceProvider } from '../interfaces/price-provider.interface';
import { ProviderUnavailableException } from '../../common/exceptions/provider-unavailable.exception';
import { PriceNotFoundException } from '../../common/exceptions/price-not-found.exception';

interface CoinGeckoMarketResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;

  [key: string]: any;
}

@Injectable()
export class CoinGeckoProvider implements IPriceProvider {
  private readonly logger = new Logger(CoinGeckoProvider.name);

  constructor(private configService: ConfigService) {}

  async fetchPrices(coinIds: string[]): Promise<PriceResult[]> {
    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
    const ids = coinIds.join(',');
    this.logger.debug(`Fetching prices for ${ids}`);
    this.logger.log(`Fetching price for ${ids} from CoinGecko`);

    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-cg-demo-api-key': apiKey || '',
        },
      });

      if (!response.ok) {
        throw new ProviderUnavailableException(response.statusText);
      }
      const data = (await response.json()) as CoinGeckoMarketResponse[];

      if (!Array.isArray(data) || data.length !== coinIds.length) {
        throw new PriceNotFoundException(ids);
      }

      return data.map((coin) => new PriceResult(coin.id, coin.current_price));
    } catch (error) {
      this.logger.error(`Error fetching price for ${ids}: ${error}`);
      if (
        error instanceof ProviderUnavailableException ||
        error instanceof PriceNotFoundException
      ) {
        throw error;
      }
      throw new ProviderUnavailableException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
