import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.enum';
import { BaseAppException } from './base-app.exception';

export class ProviderUnavailableException extends BaseAppException {
  constructor(detail?: string) {
    super(
      detail
        ? `Price provider is currently unavailable: ${detail}`
        : 'Price provider is currently unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.PROVIDER_UNAVAILABLE,
    );
  }
}
