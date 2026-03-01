import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceRecord } from '../entities/price-record.entity';

@Injectable()
export class PriceRepository {
  constructor(
    @InjectRepository(PriceRecord)
    private readonly repository: Repository<PriceRecord>,
  ) {}

  async savePrice(symbol: string, price: number): Promise<PriceRecord> {
    const record = new PriceRecord();
    record.symbol = symbol;
    record.price = price;
    record.lastUpdate = new Date();
    return this.repository.save(record);
  }

  async findHistory(symbol: string): Promise<PriceRecord[]> {
    return this.repository.find({
      where: { symbol },
      order: { lastUpdate: 'DESC' },
    });
  }
}
