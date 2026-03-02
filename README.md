# Coin Price Query Service

A NestJS service for a local technical exercise that provides current and historical cryptocurrency prices, with request batching and threshold-driven fetching.

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

# E2E tests (lightweight integration checks, no separate server required)
npm run test:e2e
```

The unit tests cover the batching rules directly:

- same-coin requests wait up to 5 seconds from the first request
- pending requests for the same coin resolve together
- 3 pending requests for the same coin trigger an immediate fetch
- different coins stay isolated from each other

The `test:e2e` script runs lightweight integration checks against compiled Nest testing modules, so it does not require a running `localhost:3000` server.

### Manual Localhost Check

If you want to hit the real Dockerized service on `localhost:3000`, start the app first:

```bash
docker-compose up --build
```

Then run the batching check script from the project root:

```bash
python3 scripts/check_local_batching.py
```

What it does:

- sends 2 concurrent requests to `GET /v1/price/bitcoin` and prints the total duration
- sends 3 concurrent requests to the same endpoint and prints the total duration
- shows the returned prices so you can confirm the batched responses match

What to expect:

- 2 concurrent requests should complete in about 5 seconds
- 3 concurrent requests should complete in under 5 seconds because the threshold triggers early

## License

MIT
