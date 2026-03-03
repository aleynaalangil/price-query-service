import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CoinIdParamDto {
  @ApiProperty({ example: 'bitcoin', description: 'CoinGecko coin ID' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'coinId must contain only lowercase letters, numbers, and hyphens',
  })
  coinId: string;
}
