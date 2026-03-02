import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPriceProvider } from '../interfaces/price-provider.interface';

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

  async fetchPrices(coinIds: string[]): Promise<Record<string, number>> {
    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
    const ids = coinIds.join(',');
    this.logger.debug(`Fetching prices for ${ids}`);
    this.logger.log(`Fetching price for ${ids} from CoinGecko`);

    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-cg-demo-api-key': apiKey || '',
        },
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }
      const data = (await response.json()) as CoinGeckoMarketResponse[];

      if (!Array.isArray(data) || data.length !== coinIds.length) {
        throw new Error(`Some ids are not found in CoinGecko response`);
      }

      return data.reduce(
        (acc, coin) => ({
          ...acc,
          [coin.id]: coin.current_price,
        }),
        {},
      );
    } catch (error) {
      this.logger.error(`Error fetching price for ${ids}: ${error}`);
      throw error;
    }
  }
}
