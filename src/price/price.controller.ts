import { Controller, Get, Param } from '@nestjs/common';
import { PriceService } from './price.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PriceHistoryResponseDto,
  PriceResponseDto,
} from './dto/price-response.dto';
import { PriceQueueService } from './price-queue.service';

@ApiTags('v1/price')
@Controller('v1/price')
export class PriceController {
  constructor(
    private readonly priceService: PriceService,
    private readonly priceQueue: PriceQueueService,
  ) {}

  @Get(':coinId')
  @ApiOperation({ summary: 'Get current price of a crypto asset' })
  @ApiResponse({
    status: 200,
    description: 'The current price.',
    type: PriceResponseDto,
  })
  async getPrice(@Param('coinId') coinId: string): Promise<PriceResponseDto> {
    const price = await this.priceQueue.getPrice(coinId);
    return { coinId, price, currency: 'usd', timestamp: new Date() };
  }

  @Get(':coinId/history')
  @ApiOperation({ summary: 'Get historical price records for a crypto asset' })
  @ApiResponse({
    status: 200,
    description: 'Historical price records.',
    type: PriceHistoryResponseDto,
  })
  async getHistory(
    @Param('coinId') coinId: string,
  ): Promise<PriceHistoryResponseDto> {
    const history = await this.priceService.findHistory(coinId);
    return { coinId, history };
  }
}
