import { ApiProperty } from '@nestjs/swagger';

export class PriceResponseDto {
  @ApiProperty({
    example: 'bitcoin',
    description: 'The unique identifier of the coin',
  })
  coinId: string;

  @ApiProperty({
    example: 65000.5,
    description: 'The current price of the coin in USD',
  })
  price: number;

  @ApiProperty({ example: 'usd', description: 'The currency of the price' })
  currency: string;

  @ApiProperty({
    example: '2026-03-01T15:00:00.000Z',
    description: 'The timestamp of the price',
  })
  timestamp: Date;
}

export class PriceHistoryItemDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the record',
  })
  id: number;

  @ApiProperty({
    example: 'bitcoin',
    description: 'The symbol or name of the coin',
  })
  symbol: string;

  @ApiProperty({
    example: 65000.5,
    description: 'The price at the recorded time',
  })
  price: number;

  @ApiProperty({
    example: '2026-03-01T15:00:00.000Z',
    description: 'The time the price was recorded',
  })
  lastUpdate: Date;
}

export class PriceHistoryResponseDto {
  @ApiProperty({
    example: 'bitcoin',
    description: 'The unique identifier of the coin',
  })
  coinId: string;

  @ApiProperty({
    type: [PriceHistoryItemDto],
    description: 'List of historical price records',
  })
  history: PriceHistoryItemDto[];
}
