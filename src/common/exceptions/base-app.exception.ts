import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.enum';

export class BaseAppException extends HttpException {
  public readonly errorCode: ErrorCode;

  constructor(message: string, status: HttpStatus, errorCode: ErrorCode) {
    super(message, status);
    this.errorCode = errorCode;
  }
}
