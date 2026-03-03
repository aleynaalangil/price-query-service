import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.enum';
import { BaseAppException } from './base-app.exception';

export class PriceNotFoundException extends BaseAppException {
  constructor(coinId: string) {
    super(
      `Price not found for coin: ${coinId}`,
      HttpStatus.NOT_FOUND,
      ErrorCode.PRICE_NOT_FOUND,
    );
  }
}
