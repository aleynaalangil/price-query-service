import { PriceResult } from '../dto/price-result.dto';

export interface IPriceProvider {
  fetchPrices(coinId: string[]): Promise<PriceResult[]>;
}

export const IPriceProvider = Symbol('IPriceProvider');
