// ============================================================
// K6 Load Test — Gumroad Clone API
// Simulates normal-to-peak user traffic on public endpoints.
//
// Usage:
//   k6 run tests/performance/load-test.js
//
// Prerequisites:
//   - Install K6: https://k6.io/docs/getting-started/installation/
//   - Server running at BASE_URL
//   - (Optional) Disable rate limiter for accurate results
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const discoverDuration = new Trend('discover_duration');
const productPageDuration = new Trend('product_page_duration');
const healthDuration = new Trend('health_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_SLUG = __ENV.TEST_SLUG || 'sample-product';

export const options = {
  // ── Local Profile (single Express process, no reverse proxy) ──
  // Max 100 VUs — realistic for localhost without PM2 cluster mode
  stages: [
    { duration: '30s', target: 20 },   // Warm up
    { duration: '1m', target: 50 },   // Normal load
    { duration: '1m', target: 100 },  // Peak load
    { duration: '30s', target: 100 },  // Sustain peak
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // ── Production Profile (uncomment when behind Nginx + PM2 cluster) ──
  // stages: [
  //   { duration: '1m', target: 50 },
  //   { duration: '3m', target: 200 },
  //   { duration: '5m', target: 500 },
  //   { duration: '3m', target: 1000 },
  //   { duration: '2m', target: 0 },
  // ],

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],   // 95% < 500ms, 99% < 1.5s
    http_req_failed: ['rate<0.01'],                    // < 1% failure rate
    errors: ['rate<0.05'],                              // Custom error rate < 5%
    discover_duration: ['p(95)<400'],
    product_page_duration: ['p(95)<300'],
    health_duration: ['p(99)<100'],
  },
};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    healthDuration.add(res.timings.duration);
    const passed = check(res, {
      'health: status 200': (r) => r.status === 200,
      'health: returns ok': (r) => JSON.parse(r.body).status === 'ok',
    });
    errorRate.add(!passed);
  });

  group('Product Discovery', () => {
    const page = Math.ceil(Math.random() * 5);
    const res = http.get(`${BASE_URL}/api/v1/products/discover?page=${page}&limit=12`);
    discoverDuration.add(res.timings.duration);
    const passed = check(res, {
      'discover: status 200': (r) => r.status === 200,
      'discover: has data': (r) => JSON.parse(r.body).success === true,
    });
    errorRate.add(!passed);
  });

  group('Featured Products', () => {
    const res = http.get(`${BASE_URL}/api/v1/products/featured`);
    const passed = check(res, {
      'featured: status 200': (r) => r.status === 200,
    });
    errorRate.add(!passed);
  });

  group('Product Page (by slug)', () => {
    const res = http.get(`${BASE_URL}/api/v1/products/slug/${TEST_SLUG}`);
    productPageDuration.add(res.timings.duration);
    const passed = check(res, {
      'product: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(!passed);
  });

  group('Categories', () => {
    const res = http.get(`${BASE_URL}/api/v1/products/categories`);
    check(res, {
      'categories: status 200': (r) => r.status === 200,
    });
  });

  group('Trending Products', () => {
    const res = http.get(`${BASE_URL}/api/v1/products/trending`);
    check(res, {
      'trending: status 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 0.5); // 0.5 - 2.5s think time
}

export function handleSummary(data) {
  return {
    'tests/performance/results/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  // K6 provides a built-in summary — this is a fallback
  return JSON.stringify(
    {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      avgDuration: data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0,
      p95Duration: data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0,
      failRate: data.metrics.http_req_failed?.values?.rate?.toFixed(4) || 0,
    },
    null,
    2
  );
}
