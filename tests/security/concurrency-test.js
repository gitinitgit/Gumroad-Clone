// ============================================================
// Database Concurrency Test — Sales Counter Accuracy
// Verifies that salesCount and revenue remain accurate
// under concurrent purchase processing using $inc atomics.
//
// Usage:
//   node tests/security/concurrency-test.js
//
// Prerequisites:
//   - MongoDB running and accessible
//   - MONGO_URI environment variable set
//   - A test product exists in the database
// ============================================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gumroad-clone';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || '';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const EARNINGS_PER_SALE_CENTS = parseInt(process.env.EARNINGS_CENTS || '900', 10); // $9.00

async function runTest() {
  // Dynamic import for ESM compatibility
  let mongoose;
  try {
    mongoose = (await import('mongoose')).default;
  } catch {
    console.log('⚠️  Mongoose not found. Run from the project root:');
    console.log('   node tests/security/concurrency-test.js\n');
    process.exit(1);
  }

  console.log('\n🔄 Database Concurrency Test — Atomic Counter Verification\n');
  console.log('─'.repeat(55));
  console.log(`  Concurrency level: ${CONCURRENCY} simultaneous writes`);
  console.log(`  MongoDB URI: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('  ✅ Connected to MongoDB\n');
  } catch (err) {
    console.log(`  ❌ Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  // Find or create a test product
  const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    price: { type: Number, default: 10 },
    priceCents: { type: Number, default: 1000 },
    status: { type: String, default: 'published' },
    creator: { type: mongoose.Schema.Types.ObjectId },
    salesCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    files: [{ fileName: String, fileUrl: String, fileSize: Number, fileType: String }],
  }, { timestamps: true, collection: 'products' }));

  let product;

  if (TEST_PRODUCT_ID) {
    product = await Product.findById(TEST_PRODUCT_ID);
    if (!product) {
      console.log(`  ❌ Product ${TEST_PRODUCT_ID} not found`);
      await mongoose.disconnect();
      process.exit(1);
    }
  } else {
    // Create a temporary test product
    product = await Product.create({
      name: `Concurrency Test Product ${Date.now()}`,
      slug: `concurrency-test-${Date.now()}`,
      price: 10,
      priceCents: 1000,
      status: 'published',
      creator: new mongoose.Types.ObjectId(),
      salesCount: 0,
      revenue: 0,
    });
    console.log(`  📦 Created test product: ${product._id}`);
  }

  const initialSales = product.salesCount;
  const initialRevenue = product.revenue;

  console.log(`  📊 Initial state: salesCount=${initialSales}, revenue=${initialRevenue}`);
  console.log(`\n  🚀 Firing ${CONCURRENCY} concurrent $inc operations...\n`);

  const startTime = Date.now();

  // Simulate concurrent purchases using atomic $inc
  const results = await Promise.allSettled(
    Array(CONCURRENCY).fill(null).map((_, i) =>
      Product.updateOne(
        { _id: product._id },
        { $inc: { salesCount: 1, revenue: EARNINGS_PER_SALE_CENTS } }
      ).then(res => ({ index: i, result: res }))
    )
  );

  const elapsed = Date.now() - startTime;

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`  ⏱️  Completed in ${elapsed}ms`);
  console.log(`  ✅ Succeeded: ${succeeded}`);
  console.log(`  ❌ Failed: ${failed}`);

  // Verify final counts
  const updated = await Product.findById(product._id);
  const expectedSales = initialSales + CONCURRENCY;
  const expectedRevenue = initialRevenue + (CONCURRENCY * EARNINGS_PER_SALE_CENTS);

  console.log(`\n  📊 Final state:`);
  console.log(`     salesCount:  ${updated.salesCount} (expected: ${expectedSales})`);
  console.log(`     revenue:     ${updated.revenue} (expected: ${expectedRevenue})`);

  let passed = true;

  if (updated.salesCount !== expectedSales) {
    console.log(`\n  ❌ CRITICAL: salesCount mismatch! Lost ${expectedSales - updated.salesCount} updates.`);
    console.log('     This indicates a race condition in counter updates.');
    passed = false;
  }

  if (updated.revenue !== expectedRevenue) {
    console.log(`\n  ❌ CRITICAL: revenue mismatch! Lost ${expectedRevenue - updated.revenue} cents.`);
    passed = false;
  }

  // Cleanup test product if we created it
  if (!TEST_PRODUCT_ID) {
    await Product.deleteOne({ _id: product._id });
    console.log(`\n  🧹 Cleaned up test product`);
  }

  console.log('\n' + '─'.repeat(55));
  if (passed) {
    console.log('\n✅ Concurrency test PASSED — all counters accurate!\n');
  } else {
    console.log('\n❌ Concurrency test FAILED — data integrity at risk!\n');
  }

  await mongoose.disconnect();
  process.exit(passed ? 0 : 1);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
