// src/common/tests/all-exceptions.filter.spec.ts
import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { PriceNotFoundException } from '../exceptions/price-not-found.exception';
import { ErrorCode } from '../constants/error-codes.enum';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/v1/price/bitcoin' });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('formats BaseAppException with its errorCode', () => {
    const exception = new PriceNotFoundException('bitcoin');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Price not found for coin: bitcoin',
        error: 'Not Found',
        errorCode: ErrorCode.PRICE_NOT_FOUND,
        path: '/v1/price/bitcoin',
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockJson.mock.calls[0][0].timestamp).toBeDefined();
  });

  it('formats NestJS HttpException with generic errorCode', () => {
    const exception = new UnauthorizedException('Token missing');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Token missing',
        error: 'Unauthorized',
        errorCode: ErrorCode.UNAUTHORIZED,
      }),
    );
  });

  it('formats ValidationPipe errors (array message) with VALIDATION_ERROR', () => {
    const exception = new BadRequestException({
      statusCode: 400,
      message: [
        'coinId must contain only lowercase letters, numbers, and hyphens',
        'coinId should not be empty',
      ],
      error: 'Bad Request',
    });
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message:
          'coinId must contain only lowercase letters, numbers, and hyphens; coinId should not be empty',
        errorCode: ErrorCode.VALIDATION_ERROR,
      }),
    );
  });

  it('formats unknown exceptions as 500 INTERNAL_ERROR', () => {
    const exception = new TypeError('Cannot read property x');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        errorCode: ErrorCode.INTERNAL_ERROR,
      }),
    );
  });
});
