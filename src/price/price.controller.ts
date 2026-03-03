import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PriceService } from './price.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PriceHistoryResponseDto,
  PriceResponseDto,
} from './dto/price-response.dto';
import { CoinIdParamDto } from './dto/coin-id-param.dto';
import { PriceQueueService } from './price-queue.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('v1/price')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/price')
export class PriceController {
  constructor(
    private readonly priceService: PriceService,
    private readonly priceQueue: PriceQueueService,
  ) {}

  @Get(':coinId')
  @ApiOperation({ summary: 'Get current price of a crypto asset' })
  @ApiParam({
    name: 'coinId',
    example: 'bitcoin',
    description: 'CoinGecko coin ID',
  })
  @ApiResponse({
    status: 200,
    description: 'The current price.',
    type: PriceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coin ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Price not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Provider unavailable',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 504,
    description: 'Batch timeout',
    type: ErrorResponseDto,
  })
  async getPrice(@Param() params: CoinIdParamDto): Promise<PriceResponseDto> {
    const price = await this.priceQueue.getPrice(params.coinId);
    return {
      coinId: params.coinId,
      price,
      currency: 'usd',
      timestamp: new Date(),
    };
  }

  @Get(':coinId/history')
  @ApiOperation({ summary: 'Get historical price records for a crypto asset' })
  @ApiParam({
    name: 'coinId',
    example: 'bitcoin',
    description: 'CoinGecko coin ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical price records.',
    type: PriceHistoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coin ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getHistory(
    @Param() params: CoinIdParamDto,
  ): Promise<PriceHistoryResponseDto> {
    const history = await this.priceService.findHistory(params.coinId);
    return { coinId: params.coinId, history };
  }
}
