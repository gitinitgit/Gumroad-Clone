// ============================================================
// Security Tests — IDOR, Auth Bypass, Input Injection
// Tests Insecure Direct Object References and authorization
// enforcement across all protected endpoints.
//
// Usage:
//   node tests/security/idor-tests.js
//
// Prerequisites:
//   - Server running at BASE_URL
//   - Two valid Clerk auth tokens (BUYER_TOKEN, CREATOR_TOKEN)
//   - A valid admin token (ADMIN_TOKEN)
//   - Known test IDs (PRODUCT_ID, PURCHASE_ID, etc.)
// ============================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API = `${BASE_URL}/api/v1`;

// Tokens — set these via environment variables before running
const BUYER_TOKEN = process.env.BUYER_TOKEN || '';
const CREATOR_TOKEN = process.env.CREATOR_TOKEN || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Test IDs — set these to existing resource IDs
const OTHER_USER_PURCHASE_ID = process.env.OTHER_PURCHASE_ID || '000000000000000000000000';
const OTHER_USER_PRODUCT_ID = process.env.OTHER_PRODUCT_ID || '000000000000000000000000';
const VALID_USER_ID = process.env.VALID_USER_ID || '000000000000000000000000';
const VALID_FILE_ID = process.env.VALID_FILE_ID || '000000000000000000000000';

let passed = 0;
let failed = 0;
let total = 0;

async function test(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(method, path, { token = '', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// ================================================================
// Test Suite
// ================================================================

async function runTests() {
  console.log('\n🔐 IDOR & Authorization Tests\n');
  console.log('─'.repeat(50));

  // ── 1. Unauthenticated Access ──
  console.log('\n📋 1. Unauthenticated Access to Protected Endpoints\n');

  await test('Checkout without auth → 401', async () => {
    const { status } = await request('POST', '/checkout/create-order');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('Library without auth → 401', async () => {
    const { status } = await request('GET', '/purchases/library');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('My products without auth → 401', async () => {
    const { status } = await request('GET', '/products/my');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('Admin dashboard without auth → 401', async () => {
    const { status } = await request('GET', '/admin/dashboard');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // ── 2. IDOR on Purchases ──
  console.log('\n📋 2. IDOR — Accessing Other Users\' Purchases\n');

  await test('Download from another user\'s purchase → 404', async () => {
    const { status } = await request('GET',
      `/purchases/${OTHER_USER_PURCHASE_ID}/download/${VALID_FILE_ID}`,
      { token: BUYER_TOKEN }
    );
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // ── 3. IDOR on Products ──
  console.log('\n📋 3. IDOR — Modifying Other Users\' Products\n');

  await test('Update another creator\'s product → 403', async () => {
    const { status } = await request('PATCH',
      `/products/${OTHER_USER_PRODUCT_ID}`,
      { token: BUYER_TOKEN, body: { name: 'Hacked Product' } }
    );
    assert(status === 403 || status === 401, `Expected 403/401, got ${status}`);
  });

  await test('Delete another creator\'s product → 403', async () => {
    const { status } = await request('DELETE',
      `/products/${OTHER_USER_PRODUCT_ID}`,
      { token: BUYER_TOKEN }
    );
    assert(status === 403 || status === 401, `Expected 403/401, got ${status}`);
  });

  // ── 4. Privilege Escalation ──
  console.log('\n📋 4. Privilege Escalation — Buyer → Admin\n');

  await test('Buyer accessing admin dashboard → 403', async () => {
    const { status } = await request('GET', '/admin/dashboard',
      { token: BUYER_TOKEN }
    );
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('Buyer blocking another user → 403', async () => {
    const { status } = await request('PATCH',
      `/admin/users/${VALID_USER_ID}/block`,
      { token: BUYER_TOKEN, body: { isBlocked: true } }
    );
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('Buyer featuring a product → 403', async () => {
    const { status } = await request('PATCH',
      `/admin/products/${OTHER_USER_PRODUCT_ID}/feature`,
      { token: BUYER_TOKEN, body: { isFeatured: true } }
    );
    assert(status === 403, `Expected 403, got ${status}`);
  });

  // ── 5. Invalid ID Formats ──
  console.log('\n📋 5. Invalid Input Handling\n');

  await test('Invalid ObjectId in product route → 400', async () => {
    const { status } = await request('GET', '/products/not-a-valid-id',
      { token: CREATOR_TOKEN }
    );
    assert(status === 400 || status === 404, `Expected 400/404, got ${status}`);
  });

  await test('Invalid ObjectId in purchase download → 400', async () => {
    const { status } = await request('GET',
      '/purchases/not-valid-id/download/also-invalid',
      { token: BUYER_TOKEN }
    );
    assert(status === 400 || status === 404, `Expected 400/404, got ${status}`);
  });

  // ── 6. NoSQL Injection Attempts ──
  console.log('\n📋 6. NoSQL Injection Attempts\n');

  await test('MongoDB operator in search query → safe response', async () => {
    const { status } = await request('GET', '/products/discover?search[$gt]=');
    assert(status === 200 || status === 400, `Expected 200/400, got ${status}`);
  });

  await test('MongoDB $where injection → safe response', async () => {
    const { status } = await request('GET',
      '/products/discover?search[$where]=function(){return true}'
    );
    assert(status === 200 || status === 400, `Expected 200/400, got ${status}`);
  });

  // ── 7. Admin Body Injection (pre-Zod fix) ──
  console.log('\n📋 7. Admin Request Body Validation\n');

  if (ADMIN_TOKEN) {
    await test('Admin block with extra fields → rejected/stripped', async () => {
      const { status, data } = await request('PATCH',
        `/admin/users/${VALID_USER_ID}/block`,
        {
          token: ADMIN_TOKEN,
          body: {
            isBlocked: true,
            role: 'admin',           // Should be rejected by Zod
            email: 'hacked@evil.com' // Should be rejected by Zod
          }
        }
      );
      // With Zod validation, extra fields should cause 400
      assert(status === 400, `Expected 400 (extra fields rejected), got ${status}`);
    });
  }

  // ── 8. Debug Endpoint Removed ──
  console.log('\n📋 8. Debug Endpoint Removed\n');

  await test('/debug/env should return 404', async () => {
    const res = await fetch(`${BASE_URL}/debug/env`);
    assert(res.status === 404, `Expected 404, got ${res.status} — DEBUG ENDPOINT STILL EXPOSED!`);
  });

  // ── Summary ──
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed}/${total} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('⚠️  Some security tests failed. Review the output above.\n');
    process.exit(1);
  } else {
    console.log('✅ All security tests passed!\n');
  }
}

// ── Preflight Check ──
if (!BUYER_TOKEN) {
  console.log('⚠️  Warning: BUYER_TOKEN not set. Auth-dependent tests will likely fail.');
  console.log('   Set environment variables: BUYER_TOKEN, CREATOR_TOKEN, ADMIN_TOKEN\n');
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
