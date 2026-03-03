const REQUEST_URL = 'http://localhost:3000/v1/price/bitcoin';
const TOKEN_URL = 'http://localhost:3000/v1/auth/token';
const TIMEOUT_MS = 15_000;

type PriceResponse = {
  price: number;
};

type TokenResponse = {
  access_token: string;
};

async function fetchAccessToken(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(TOKEN_URL, {
      signal: controller.signal,
      headers: { accept: '*/*' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.access_token) {
      throw new Error('Auth response did not include access_token');
    }

    return data.access_token;
  } finally {
    clearTimeout(timeout);
  }
}

async function hitRequest(jwt: string): Promise<PriceResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = {
    accept: 'application/json',
    authorization: `Bearer ${jwt}`,
  };

  try {
    const response = await fetch(REQUEST_URL, {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as PriceResponse;
  } finally {
    clearTimeout(timeout);
  }
}

async function runBatch(requestCount: number, jwt: string): Promise<void> {
  console.log(`Starting ${requestCount} concurrent requests...`);
  const start = performance.now();

  const results = await Promise.all(
    Array.from({ length: requestCount }, () => hitRequest(jwt)),
  );

  const durationSeconds = (performance.now() - start) / 1000;
  const prices = results.map((result) => result.price);
  const expectation = requestCount === 2 ? 'about 5s' : 'under 5s';

  console.log(`\n${requestCount} concurrent requests`);
  console.log(`duration: ${durationSeconds.toFixed(2)}s`);
  console.log(`prices:   ${JSON.stringify(prices)}`);
  console.log(`expect:   ${expectation}`);
}

async function main(): Promise<number> {
  console.log(`Fetching access token from ${TOKEN_URL}`);

  try {
    const jwt = await fetchAccessToken();

    console.log(`Hitting ${REQUEST_URL} with JWT auth`);
    await runBatch(2, jwt);
    await runBatch(3, jwt);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nRequest check failed: ${message}`);
    console.error(
      'Make sure the Docker service is running and reachable on localhost:3000.',
    );
    return 1;
  }

  return 0;
}

void main().then((exitCode) => {
  process.exitCode = exitCode;
});
