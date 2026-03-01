# Coin Price Query Service

A NestJS-based service that provides real-time and historical cryptocurrency price data, featuring request batching and threshold-driven fetching for efficiency.

## Key Features

- **Request Batching:** Groups multiple requests for the same asset within a configurable time window (default 5s) to minimize API calls.
- **Threshold Triggering:** Executes a fetch immediately once a certain number of concurrent requests (default 3) is reached.
- **Data Persistence:** Stores price records in PostgreSQL for historical querying.

## API Endpoints

- `GET /v1/price/:coinId` - Current price of a cryptocurrency (e.g., `bitcoin`)
- `GET /v1/price/:coinId/history` - Historical price records
- `GET /docs` - Swagger API Documentation

## Quick Start

### Local Development

```bash
npm install
npm run start:dev
```

### Docker

```bash
docker-compose up --build
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## License

MIT
