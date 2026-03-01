export interface IPriceProvider {
  fetchPrice(coinId: string): Promise<number>;
}

export const IPriceProvider = Symbol('IPriceProvider');
