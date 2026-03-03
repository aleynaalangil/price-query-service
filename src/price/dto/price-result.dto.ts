export class PriceResult {
  coinId: string;
  price: number;

  constructor(coinId: string, price: number) {
    this.coinId = coinId;
    this.price = price;
  }
}
