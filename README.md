# Coin Price Query Service

A NestJS service for a local technical exercise that provides current and historical cryptocurrency prices, with request
batching and threshold-driven fetching.

## Quick Start

### Local Development

```bash
npm install
```

### Docker

```bash
docker-compose up --build
```

## Architecture

### Request Batching Flow (core pattern)

1. **PriceController** receives `GET /v1/price/:coinId` (JWT-protected)
2. **PriceQueueService** creates a UUID request ID, enqueues a BullMQ job, and returns a Promise that resolves when an
   event `price.result.{requestId}` fires
3. **PriceProcessor** (BullMQ worker) collects jobs into per-coin batches with two flush triggers:

- **Timeout**: 5-second window from first request in batch
- **Threshold**: 3 pending requests trigger immediate flush

4. On flush, calls **PriceService.fetchAndSaveBatch()** which deduplicates coin IDs, fetches from provider, saves to DB
5. Results are delivered back via **EventEmitter2** events per request ID

### Module Structure

- **AuthModule** — JWT token generation (`GET /v1/auth/token`) and `JwtAuthGuard` for route protection
- **PriceModule** — All price domain logic: controller, queue service, processor, service, repository, provider
- **AppModule** — Wires global config (ConfigModule, TypeORM, BullMQ, EventEmitter, Scheduler)

### Key Abstractions

- **IPriceProvider** interface (`price/interfaces/price-provider.interface.ts`) — pluggable price data source, currently
  implemented by `CoinGeckoProvider`
- **PriceRepository** — TypeORM wrapper over `PriceRecord` entity
- **PriceRecord entity** — columns: id, symbol, price (decimal 18,8), lastUpdate

### API Endpoints

- `GET /v1/auth/token` — Returns JWT access token
- `GET /v1/price/:coinId` — Current price (JWT required)
- `GET /v1/price/:coinId/history` — Price history (JWT required)
- `GET /docs` — Swagger UI

## Infrastructure

- **PostgreSQL**: TypeORM with `synchronize: true` (auto-creates schema from entities)
- **Redis**: BullMQ queue backend, queue name is `price-queries`
- **Environment**: configured via `.env` file (see `.env.example`), loaded through `@nestjs/config`

## Testing Patterns

- Unit tests live in `src/price/tests/*.spec.ts`
- PriceProcessor tests use `jest.useFakeTimers()` to control batching timeouts
- E2E tests in `test/*.e2e-spec.ts` mock services and test HTTP response shapes via supertest
- `scripts/check_local_batching.ts` — manual integration test against running Docker stack

## License

MIT
