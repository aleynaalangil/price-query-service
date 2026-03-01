import request from 'supertest';
import {
  PriceHistoryResponseDto,
  PriceResponseDto,
} from '../src/price/dto/price-response.dto';

describe('Price API (e2e) - Real Service Tests', () => {
  const baseUrl = 'http://localhost:3000';

  // Helper to wait between tests to avoid hitting external rate limits too hard
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  afterEach(async () => {
    await wait(1000);
  });

  describe('1. Request Batching (Time-Based)', () => {
    it('should group requests within 5s', async () => {
      const startTime = Date.now();

      // Launch 2 requests
      const [res1, res2] = await Promise.all([
        request(baseUrl).get('/v1/price/bitcoin'),
        request(baseUrl).get('/v1/price/bitcoin'),
      ]);

      const duration = Date.now() - startTime;

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const body1 = res1.body as PriceResponseDto;
      const body2 = res2.body as PriceResponseDto;
      expect(body1.price).toBe(body2.price);

      // Should take around 5s due to batching window
      // We use a slightly lower bound to account for network/processing overhead
      expect(duration).toBeGreaterThanOrEqual(4000);
    }, 15000);
  });

  describe('2. Threshold Triggering (Early Execution)', () => {
    it('should trigger immediate fetch when 3 requests arrive', async () => {
      const startTime = Date.now();

      // Launch 3 requests simultaneously
      const [res1, res2, res3] = await Promise.all([
        request(baseUrl).get('/v1/price/bitcoin'),
        request(baseUrl).get('/v1/price/bitcoin'),
        request(baseUrl).get('/v1/price/bitcoin'),
      ]);

      const duration = Date.now() - startTime;

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);

      // Should be much faster than 5s because threshold=3
      expect(duration).toBeLessThan(4000);
    }, 15000);
  });

  describe('3. Independent Coin Isolation', () => {
    it('should handle different coins independently', async () => {
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;

      while (attempts < maxAttempts && !success) {
        try {
          const [resBtc, resEth] = await Promise.all([
            request(baseUrl).get('/v1/price/bitcoin'),
            request(baseUrl).get('/v1/price/ethereum'),
          ]);

          expect(resBtc.status).toBe(200);
          expect(resEth.status).toBe(200);

          const bodyBtc = resBtc.body as PriceResponseDto;
          const bodyEth = resEth.body as PriceResponseDto;
          expect(bodyBtc.coinId).toBe('bitcoin');
          expect(bodyEth.coinId).toBe('ethereum');
          success = true;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) throw error;
          await wait(2000); // Wait longer between retries
        }
      }
    }, 30000);
  });

  describe('5. Historical Price Query', () => {
    it('should retrieve history', async () => {
      const res = await request(baseUrl).get('/v1/price/bitcoin/history');

      expect(res.status).toBe(200);
      const body = res.body as PriceHistoryResponseDto;
      expect(body).toHaveProperty('history');
      expect(Array.isArray(body.history)).toBe(true);
    });
  });

  describe('6. Concurrency Stress Test', () => {
    it('should handle parallel requests with batching', async () => {
      // Reduced to 9 to trigger exactly 3 batches (9/3 = 3) or fewer
      const requests = Array.from({ length: 9 }, () =>
        request(baseUrl).get('/v1/price/bitcoin'),
      );

      const results = await Promise.all(requests);

      results.forEach((res) => {
        if (res.status !== 200) {
          console.log('Error Response:', res.body);
        }
        expect(res.status).toBe(200);
      });
    }, 30000);
  });
});
