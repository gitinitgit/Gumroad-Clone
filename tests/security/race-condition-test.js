// ============================================================
// Race Condition Test — Concurrent Payment Verification
// Sends multiple simultaneous verify-payment requests to
// ensure only one succeeds and no duplicate purchases are created.
//
// Usage:
//   node tests/security/race-condition-test.js
//
// Prerequisites:
//   - Server running
//   - A valid Razorpay test order + payment (use Razorpay test mode)
//   - AUTH_TOKEN set to a valid Clerk session token
// ============================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API = `${BASE_URL}/api/v1`;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// These must be real Razorpay test values for a valid but unverified order
const RAZORPAY_ORDER_ID = process.env.RAZORPAY_ORDER_ID || '';
const RAZORPAY_PAYMENT_ID = process.env.RAZORPAY_PAYMENT_ID || '';
const RAZORPAY_SIGNATURE = process.env.RAZORPAY_SIGNATURE || '';

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

async function verifyPayment() {
  const res = await fetch(`${API}/checkout/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      razorpayOrderId: RAZORPAY_ORDER_ID,
      razorpayPaymentId: RAZORPAY_PAYMENT_ID,
      razorpaySignature: RAZORPAY_SIGNATURE,
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function runRaceTest() {
  console.log('\n⚡ Race Condition Test — Concurrent Payment Verification\n');
  console.log('─'.repeat(55));
  console.log(`  Concurrency level: ${CONCURRENCY} simultaneous requests`);
  console.log(`  Target: POST ${API}/checkout/verify-payment\n`);

  if (!AUTH_TOKEN || !RAZORPAY_ORDER_ID || !RAZORPAY_PAYMENT_ID || !RAZORPAY_SIGNATURE) {
    console.log('⚠️  Missing required environment variables:');
    console.log('   AUTH_TOKEN, RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, RAZORPAY_SIGNATURE');
    console.log('\n   Generate a test order first, then run this script.\n');
    process.exit(1);
  }

  // Fire all requests simultaneously
  console.log(`  🚀 Sending ${CONCURRENCY} concurrent requests...\n`);
  const startTime = Date.now();

  const results = await Promise.all(
    Array(CONCURRENCY).fill(null).map(() => verifyPayment())
  );

  const elapsed = Date.now() - startTime;

  // Analyze results
  const successes = results.filter(r => r.status === 200);
  const conflicts = results.filter(r => r.status === 409);
  const authErrors = results.filter(r => r.status === 401);
  const serverErrors = results.filter(r => r.status >= 500);
  const otherErrors = results.filter(r => ![200, 409, 401].includes(r.status) && r.status < 500);

  console.log('  📊 Results:');
  console.log(`     200 (Success):    ${successes.length}`);
  console.log(`     409 (Conflict):   ${conflicts.length}`);
  console.log(`     401 (Auth):       ${authErrors.length}`);
  console.log(`     5xx (Server):     ${serverErrors.length}`);
  console.log(`     Other:            ${otherErrors.length}`);
  console.log(`     Total time:       ${elapsed}ms\n`);

  // Assertions
  let passed = true;

  if (successes.length > 1) {
    console.log('  ❌ CRITICAL: Multiple successful payments! Race condition exists.');
    console.log(`     Expected: exactly 1 success, got ${successes.length}`);
    passed = false;
  } else if (successes.length === 1) {
    console.log('  ✅ Exactly 1 request succeeded — idempotency guard working.');
  } else if (successes.length === 0 && conflicts.length > 0) {
    console.log('  ✅ No successes (order may have been pre-processed). All returned 409.');
  }

  if (conflicts.length !== CONCURRENCY - successes.length - authErrors.length - serverErrors.length - otherErrors.length) {
    // This is informational — not all non-200s may be 409
  }

  if (serverErrors.length > 0) {
    console.log('  ⚠️  Server errors detected — the race condition may cause 500s instead of 409s.');
    console.log('     This needs investigation — transactions may not be rolling back cleanly.');
    serverErrors.forEach((r, i) => {
      console.log(`     Error ${i + 1}: ${r.status} — ${JSON.stringify(r.data)}`);
    });
    passed = false;
  }

  console.log('\n' + '─'.repeat(55));
  if (passed) {
    console.log('\n✅ Race condition test PASSED\n');
  } else {
    console.log('\n❌ Race condition test FAILED — see details above\n');
    process.exit(1);
  }
}

runRaceTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
