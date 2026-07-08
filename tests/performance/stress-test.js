// ============================================================
// K6 Stress Test — Gumroad Clone API
// Pushes past physical limits to find the breaking point.
//
// Usage:
//   k6 run tests/performance/stress-test.js
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '15s', target: 50 },      // Baseline
    { duration: '20s', target: 200 },     // Heavy load
    { duration: '20s', target: 500 },     // Breaking point search
    { duration: '15s', target: 800 },     // Beyond capacity
    { duration: '15s', target: 0 },       // Recovery
  ],
  thresholds: {
    // Relaxed thresholds — we EXPECT failures, we want to know WHERE
    http_req_duration: ['p(50)<2000'],    // Median under 2s is acceptable
    errors: ['rate<0.50'],                // Allow up to 50% errors
  },
};

export default function () {
  group('Discovery under stress', () => {
    const res = http.get(`${BASE_URL}/api/v1/products/discover?page=1&limit=12`);
    const passed = check(res, {
      'status is not 5xx': (r) => r.status < 500,
      'response time < 5s': (r) => r.timings.duration < 5000,
    });
    errorRate.add(!passed);
  });

  group('Health under stress', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health: still responding': (r) => r.status === 200,
    });
  });

  group('Featured under stress', () => {
    const res = http.get(`${BASE_URL}/api/v1/products/featured`);
    check(res, {
      'featured: status ok': (r) => r.status < 500,
    });
  });

  sleep(Math.random() * 0.5); // Minimal think time for maximum pressure
}
