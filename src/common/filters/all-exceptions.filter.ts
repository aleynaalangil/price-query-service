import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseAppException } from '../exceptions/base-app.exception';
import { ErrorCode } from '../constants/error-codes.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private static readonly STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
    [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
    [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
    [HttpStatus.NOT_FOUND]: ErrorCode.PRICE_NOT_FOUND,
    [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
    [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.PROVIDER_UNAVAILABLE,
    [HttpStatus.GATEWAY_TIMEOUT]: ErrorCode.BATCH_TIMEOUT,
  };

  private static readonly STATUS_TO_ERROR_NAME: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Bad Request',
    [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
    [HttpStatus.FORBIDDEN]: 'Forbidden',
    [HttpStatus.NOT_FOUND]: 'Not Found',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
    [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
  };

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status(code: number): { json(body: unknown): void };
    }>();
    const request = ctx.getRequest<{ url: string }>();

    let statusCode: number;
    let message: string;
    let errorCode: ErrorCode;

    if (exception instanceof BaseAppException) {
      statusCode = exception.getStatus();
      message = exception.message;
      errorCode = exception.errorCode;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          message = (resp.message as string[]).join('; ');
          errorCode = ErrorCode.VALIDATION_ERROR;
        } else {
          message =
            typeof resp.message === 'string' ? resp.message : exception.message;
          errorCode =
            AllExceptionsFilter.STATUS_TO_ERROR_CODE[statusCode] ??
            ErrorCode.INTERNAL_ERROR;
        }
      } else {
        message = exception.message;
        errorCode =
          AllExceptionsFilter.STATUS_TO_ERROR_CODE[statusCode] ??
          ErrorCode.INTERNAL_ERROR;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = ErrorCode.INTERNAL_ERROR;
      this.logger.error('Unhandled exception', exception);
    }

    const errorName =
      AllExceptionsFilter.STATUS_TO_ERROR_NAME[statusCode] ??
      'Internal Server Error';

    response.status(statusCode).json({
      statusCode,
      message,
      error: errorName,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
