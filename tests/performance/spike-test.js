// ============================================================
// K6 Spike Test — Gumroad Clone API
// Simulates a sudden viral traffic surge (0 → 2000 users in 10s).
//
// Usage:
//   k6 run tests/performance/spike-test.js
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const spikeDuration = new Trend('spike_response_time');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_SLUG = __ENV.TEST_SLUG || 'sample-product';

export const options = {
  // Local profile
  stages: [
    { duration: '30s', target: 10 },    // Normal baseline
    { duration: '10s', target: 300 },   // ⚡ SPIKE — viral moment
    { duration: '1m', target: 300 },    // Sustain spike
    { duration: '10s', target: 20 },    // Traffic drops off
    { duration: '30s', target: 20 },    // Recovery period
    { duration: '10s', target: 0 },     // Shutdown
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],   // Allow 3s during spike
    http_req_failed: ['rate<0.10'],       // < 10% failures during spike
    errors: ['rate<0.15'],
  },
};

export default function () {
  // Simulates what happens when a creator tweets their product link
  // — everyone hits the product page at once
  const productRes = http.get(`${BASE_URL}/api/v1/products/slug/${TEST_SLUG}`);
  spikeDuration.add(productRes.timings.duration);
  const passed = check(productRes, {
    'product page loads': (r) => r.status === 200 || r.status === 404,
    'response under 5s': (r) => r.timings.duration < 5000,
  });
  errorRate.add(!passed);

  // Some users also browse discover
  if (Math.random() < 0.3) {
    const discoverRes = http.get(`${BASE_URL}/api/v1/products/discover?page=1&limit=12`);
    check(discoverRes, {
      'discover loads during spike': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 0.5);
}
