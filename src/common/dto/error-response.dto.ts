// src/common/dto/error-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'coinId must contain only lowercase letters, numbers, and hyphens',
    description: 'Human-readable error message',
  })
  message: string;

  @ApiProperty({ example: 'Bad Request', description: 'HTTP error type' })
  error: string;

  @ApiProperty({
    example: 'INVALID_COIN_ID',
    description: 'Application-specific error code',
  })
  errorCode: string;

  @ApiProperty({
    example: '2026-03-03T12:00:00.000Z',
    description: 'ISO 8601 timestamp',
  })
  timestamp: string;

  @ApiProperty({ example: '/v1/price/INVALID', description: 'Request path' })
  path: string;
}
