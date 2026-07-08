// ============================================================
// Node.js Load Test — Gumroad Clone API
//
// A zero-dependency load test runner that works without K6.
// Tests your API under concurrent load and reports p50/p95/p99
// latencies, error rates, and throughput.
//
// Usage:
//   node tests/performance/node-load-test.js
//
// Configuration via environment variables:
//   BASE_URL       — Server URL (default: http://localhost:5000)
//   CONCURRENCY    — Simultaneous requests (default: 50)
//   DURATION_SEC   — Test duration in seconds (default: 60)
//   RAMP_UP_SEC    — Ramp-up period in seconds (default: 10)
// ============================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const DURATION_SEC = parseInt(process.env.DURATION_SEC || '60', 10);
const RAMP_UP_SEC = parseInt(process.env.RAMP_UP_SEC || '10', 10);

// ─── Endpoints to test ──────────────────────────────────────
const ENDPOINTS = [
  { name: 'Health',     method: 'GET', path: '/health' },
  { name: 'Discover',   method: 'GET', path: '/api/v1/products/discover?page=1&limit=12' },
  { name: 'Featured',   method: 'GET', path: '/api/v1/products/featured' },
  { name: 'Trending',   method: 'GET', path: '/api/v1/products/trending' },
  { name: 'Categories', method: 'GET', path: '/api/v1/products/categories' },
];

// ─── Metrics storage ────────────────────────────────────────
const metrics = {};
ENDPOINTS.forEach(ep => {
  metrics[ep.name] = {
    latencies: [],
    errors: 0,
    successes: 0,
  };
});

let totalRequests = 0;
let isRunning = true;

// ─── Helper: make a request and record metrics ─────────────
async function makeRequest(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: endpoint.method,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const elapsed = performance.now() - start;
    totalRequests++;

    if (res.status >= 200 && res.status < 400) {
      metrics[endpoint.name].successes++;
    } else {
      metrics[endpoint.name].errors++;
    }
    metrics[endpoint.name].latencies.push(elapsed);

    // Consume body to free resources
    await res.text();
  } catch (err) {
    const elapsed = performance.now() - start;
    metrics[endpoint.name].errors++;
    metrics[endpoint.name].latencies.push(elapsed);
    totalRequests++;
  }
}

// ─── Worker: one "virtual user" ─────────────────────────────
async function virtualUser(id) {
  while (isRunning) {
    // Pick a random endpoint
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    await makeRequest(endpoint);

    // Think time: 100-500ms
    await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
  }
}

// ─── Calculate percentile ───────────────────────────────────
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Live progress reporter ─────────────────────────────────
function printProgress(elapsedSec, activUsers) {
  const allLatencies = Object.values(metrics).flatMap(m => m.latencies);
  const totalErrors = Object.values(metrics).reduce((s, m) => s + m.errors, 0);
  const rps = totalRequests / Math.max(elapsedSec, 1);

  process.stdout.write(
    `\r  ⏱  ${elapsedSec}s / ${DURATION_SEC}s | ` +
    `👥 ${activUsers} VUs | ` +
    `📊 ${totalRequests} reqs (${rps.toFixed(0)} rps) | ` +
    `p95: ${percentile(allLatencies, 95).toFixed(0)}ms | ` +
    `❌ ${totalErrors} errors    `
  );
}

// ─── Final report ───────────────────────────────────────────
function printReport(durationSec) {
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('  📊 LOAD TEST RESULTS');
  console.log('═'.repeat(70));
  console.log(`  Duration:    ${durationSec}s`);
  console.log(`  Concurrency: ${CONCURRENCY} virtual users`);
  console.log(`  Total Reqs:  ${totalRequests}`);
  console.log(`  Throughput:  ${(totalRequests / durationSec).toFixed(1)} req/s`);
  console.log('─'.repeat(70));

  const allLatencies = [];
  let allErrors = 0;
  let allSuccesses = 0;

  console.log('\n  Per-Endpoint Breakdown:\n');
  console.log(
    '  ' +
    'Endpoint'.padEnd(14) +
    'Reqs'.padStart(8) +
    'Errors'.padStart(8) +
    'p50 (ms)'.padStart(10) +
    'p95 (ms)'.padStart(10) +
    'p99 (ms)'.padStart(10) +
    'Max (ms)'.padStart(10)
  );
  console.log('  ' + '─'.repeat(68));

  for (const [name, data] of Object.entries(metrics)) {
    const total = data.successes + data.errors;
    if (total === 0) continue;

    allLatencies.push(...data.latencies);
    allErrors += data.errors;
    allSuccesses += data.successes;

    const p50 = percentile(data.latencies, 50);
    const p95 = percentile(data.latencies, 95);
    const p99 = percentile(data.latencies, 99);
    const max = Math.max(...data.latencies);

    console.log(
      '  ' +
      name.padEnd(14) +
      total.toString().padStart(8) +
      data.errors.toString().padStart(8) +
      p50.toFixed(0).padStart(10) +
      p95.toFixed(0).padStart(10) +
      p99.toFixed(0).padStart(10) +
      max.toFixed(0).padStart(10)
    );
  }

  console.log('  ' + '─'.repeat(68));

  const globalP50 = percentile(allLatencies, 50);
  const globalP95 = percentile(allLatencies, 95);
  const globalP99 = percentile(allLatencies, 99);
  const globalMax = allLatencies.length > 0 ? Math.max(...allLatencies) : 0;

  console.log(
    '  ' +
    'TOTAL'.padEnd(14) +
    totalRequests.toString().padStart(8) +
    allErrors.toString().padStart(8) +
    globalP50.toFixed(0).padStart(10) +
    globalP95.toFixed(0).padStart(10) +
    globalP99.toFixed(0).padStart(10) +
    globalMax.toFixed(0).padStart(10)
  );

  console.log('\n' + '═'.repeat(70));

  // ── Pass/Fail Criteria ──
  const errorRate = allErrors / Math.max(totalRequests, 1);

  console.log('\n  🎯 Threshold Checks:\n');

  const p95Pass = globalP95 < 500;
  console.log(`  ${p95Pass ? '✅' : '❌'} p95 latency < 500ms: ${globalP95.toFixed(0)}ms ${p95Pass ? '(PASS)' : '(FAIL)'}`);

  const p99Pass = globalP99 < 1500;
  console.log(`  ${p99Pass ? '✅' : '❌'} p99 latency < 1500ms: ${globalP99.toFixed(0)}ms ${p99Pass ? '(PASS)' : '(FAIL)'}`);

  const errorPass = errorRate < 0.01;
  console.log(`  ${errorPass ? '✅' : '❌'} Error rate < 1%: ${(errorRate * 100).toFixed(2)}% ${errorPass ? '(PASS)' : '(FAIL)'}`);

  const rpsPass = totalRequests / durationSec > 10;
  console.log(`  ${rpsPass ? '✅' : '❌'} Throughput > 10 rps: ${(totalRequests / durationSec).toFixed(1)} rps ${rpsPass ? '(PASS)' : '(FAIL)'}`);

  const allPass = p95Pass && p99Pass && errorPass && rpsPass;
  console.log(`\n  ${allPass ? '🟢 ALL THRESHOLDS PASSED' : '🔴 SOME THRESHOLDS FAILED'}\n`);

  process.exit(allPass ? 0 : 1);
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('\n  ⚡ Gumroad Clone — Load Test\n');
  console.log(`  Target:      ${BASE_URL}`);
  console.log(`  Concurrency: ${CONCURRENCY} virtual users`);
  console.log(`  Duration:    ${DURATION_SEC}s (+ ${RAMP_UP_SEC}s ramp-up)`);
  console.log(`  Endpoints:   ${ENDPOINTS.map(e => e.name).join(', ')}`);
  console.log('\n  ' + '─'.repeat(55) + '\n');

  // Preflight check — is the server reachable?
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Health returned ${res.status}`);
    console.log('  ✅ Server is reachable\n');
  } catch (err) {
    console.log(`  ❌ Cannot reach ${BASE_URL}/health — is the server running?\n`);
    console.log(`     Error: ${err.message}\n`);
    console.log('  Start the server first:  npm run dev\n');
    process.exit(1);
  }

  const startTime = Date.now();
  const workers = [];

  // Ramp up workers gradually
  for (let i = 0; i < CONCURRENCY; i++) {
    const delay = (RAMP_UP_SEC * 1000 * i) / CONCURRENCY;
    const worker = new Promise(resolve => {
      setTimeout(() => {
        virtualUser(i).then(resolve);
      }, delay);
    });
    workers.push(worker);
  }

  // Progress reporter
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const activeUsers = Math.min(CONCURRENCY, Math.floor((elapsed / RAMP_UP_SEC) * CONCURRENCY));
    printProgress(elapsed, activeUsers);
  }, 1000);

  // Stop after duration
  setTimeout(() => {
    isRunning = false;
    clearInterval(progressInterval);
    const actualDuration = (Date.now() - startTime) / 1000;
    printReport(actualDuration);
  }, (DURATION_SEC + RAMP_UP_SEC) * 1000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
