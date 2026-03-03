// src/common/tests/exceptions.spec.ts
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.enum';
import { BaseAppException } from '../exceptions/base-app.exception';
import { PriceNotFoundException } from '../exceptions/price-not-found.exception';
import { ProviderUnavailableException } from '../exceptions/provider-unavailable.exception';
import { BatchTimeoutException } from '../exceptions/batch-timeout.exception';
import { InvalidCoinIdException } from '../exceptions/invalid-coin-id.exception';

describe('Custom Exceptions', () => {
  describe('PriceNotFoundException', () => {
    it('has correct status, errorCode, and message', () => {
      const ex = new PriceNotFoundException('bitcoin');
      expect(ex).toBeInstanceOf(BaseAppException);
      expect(ex.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(ex.errorCode).toBe(ErrorCode.PRICE_NOT_FOUND);
      expect(ex.message).toContain('bitcoin');
    });
  });

  describe('ProviderUnavailableException', () => {
    it('has correct status, errorCode, and message', () => {
      const ex = new ProviderUnavailableException();
      expect(ex).toBeInstanceOf(BaseAppException);
      expect(ex.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(ex.errorCode).toBe(ErrorCode.PROVIDER_UNAVAILABLE);
    });
  });

  describe('BatchTimeoutException', () => {
    it('has correct status, errorCode, and message', () => {
      const ex = new BatchTimeoutException('bitcoin');
      expect(ex).toBeInstanceOf(BaseAppException);
      expect(ex.getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT);
      expect(ex.errorCode).toBe(ErrorCode.BATCH_TIMEOUT);
      expect(ex.message).toContain('bitcoin');
    });
  });

  describe('InvalidCoinIdException', () => {
    it('has correct status, errorCode, and message', () => {
      const ex = new InvalidCoinIdException('INVALID');
      expect(ex).toBeInstanceOf(BaseAppException);
      expect(ex.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(ex.errorCode).toBe(ErrorCode.INVALID_COIN_ID);
      expect(ex.message).toContain('INVALID');
    });
  });
});
