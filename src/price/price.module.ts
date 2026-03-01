import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceRecord } from '../entities/price-record.entity';
import { PriceQueueService } from './price-queue.service';
import { IPriceProvider } from './interfaces/price-provider.interface';
import { CoinGeckoProvider } from './providers/coingecko.provider';
import { PriceRepository } from './price.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PriceRecord])],
  providers: [
    PriceService,
    PriceQueueService,
    PriceRepository,
    {
      provide: IPriceProvider,
      useClass: CoinGeckoProvider,
    },
  ],
  controllers: [PriceController],
})
export class PriceModule {}
