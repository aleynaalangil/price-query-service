export interface IPriceProvider {
  fetchPrices(coinId: string[]): Promise<Record<string, number>>;
}

export const IPriceProvider = Symbol('IPriceProvider');
