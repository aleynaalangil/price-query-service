import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.enum';
import { BaseAppException } from './base-app.exception';

export class BatchTimeoutException extends BaseAppException {
  constructor(coinId: string) {
    super(
      `Price query timed out for coin: ${coinId}`,
      HttpStatus.GATEWAY_TIMEOUT,
      ErrorCode.BATCH_TIMEOUT,
    );
  }
}
