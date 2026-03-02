#!/usr/bin/env python3

import concurrent.futures
import json
import sys
import time
import urllib.request


URL = "http://localhost:3000/v1/price/bitcoin"
TIMEOUT_SECONDS = 15


def hit_request(_: int) -> dict:
    with urllib.request.urlopen(URL, timeout=TIMEOUT_SECONDS) as response:
        return json.load(response)


def run_batch(request_count: int) -> None:
    print(f"Starting {request_count} concurrent requests...", flush=True)
    start = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=request_count) as pool:
        results = list(pool.map(hit_request, range(request_count)))

    duration = time.perf_counter() - start
    prices = [result["price"] for result in results]
    expectation = "about 5s" if request_count == 2 else "under 5s"

    print(f"\n{request_count} concurrent requests", flush=True)
    print(f"duration: {duration:.2f}s", flush=True)
    print(f"prices:   {prices}", flush=True)
    print(f"expect:   {expectation}", flush=True)


def main() -> int:
    print(f"Hitting {URL}", flush=True)

    try:
        run_batch(2)
        run_batch(3)
    except Exception as error:
        print(f"\nRequest check failed: {error}", file=sys.stderr, flush=True)
        print(
            "Make sure the Docker service is running and reachable on localhost:3000.",
            file=sys.stderr,
            flush=True,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
