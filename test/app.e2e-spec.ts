import request from 'supertest';
import {
  PriceHistoryResponseDto,
  PriceResponseDto,
} from './../src/price/dto/price-response.dto';

describe('AppController (e2e)', () => {
  const baseUrl = 'http://localhost:3000';

  describe('/v1/price', () => {
    it('/:coinId (GET)', () => {
      return request(baseUrl)
        .get('/v1/price/bitcoin')
        .expect(200)
        .expect((res) => {
          const body = res.body as PriceResponseDto;
          expect(body).toHaveProperty('coinId', 'bitcoin');
          expect(body).toHaveProperty('price');
          expect(body).toHaveProperty('currency', 'usd');
          expect(body).toHaveProperty('timestamp');
        });
    }, 6000);

    it('/:coinId/history (GET)', () => {
      return request(baseUrl)
        .get('/v1/price/bitcoin/history')
        .expect(200)
        .expect((res) => {
          const body = res.body as PriceHistoryResponseDto;
          expect(body).toHaveProperty('coinId', 'bitcoin');
          expect(body).toHaveProperty('history');
          expect(Array.isArray(body.history)).toBe(true);
        });
    });
  });
});
