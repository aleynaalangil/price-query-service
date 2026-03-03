import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.enum';
import { BaseAppException } from './base-app.exception';

export class InvalidCoinIdException extends BaseAppException {
  constructor(coinId: string) {
    super(
      `Invalid coin ID: ${coinId}`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_COIN_ID,
    );
  }
}
