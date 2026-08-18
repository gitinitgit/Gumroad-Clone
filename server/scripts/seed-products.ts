import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import matter from 'gray-matter';
import slugify from 'slugify';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gumroad-clone';
const PRODUCTS_DIR = path.resolve(__dirname, '../content/products');

async function seedProducts() {
  try {
    console.log(`Connecting to MongoDB... (${MONGO_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@')})`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const productsCollection = db.collection('products');

    // Find or create a default demo creator user
    let creator = await usersCollection.findOne({ role: 'creator' });
    if (!creator) {
      creator = await usersCollection.findOne({});
    }

    if (!creator) {
      const newCreator = {
        clerkId: 'demo_creator_system',
        name: 'Demo Creator',
        username: 'democreator',
        email: 'creator@gumroad-clone.com',
        role: 'creator',
        avatar: '/asset/assets/images/gumroad-default-avatar-5.png',
        bio: 'Creating top-tier digital assets, courses, and design kits.',
        socialLinks: { twitter: 'https://twitter.com' },
        paymentSettings: {},
        notificationSettings: {
          emailOnSale: true,
          emailOnReview: true,
          emailOnPayout: true,
          pushEnabled: true,
        },
        isVerified: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await usersCollection.insertOne(newCreator);
      creator = { _id: result.insertedId, ...newCreator };
      console.log('Created demo creator user:', creator.name);
    } else {
      console.log(`Using existing creator account: ${creator.name} (${creator._id})`);
    }

    if (!fs.existsSync(PRODUCTS_DIR)) {
      console.error(`Products directory not found at: ${PRODUCTS_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith('.md'));
    console.log(`Found ${files.length} markdown products to seed...`);

    let seededCount = 0;
    for (const file of files) {
      const filePath = path.join(PRODUCTS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(fileContent);

      const slug =
        data.slug ||
        (data.name ? slugify(data.name, { lower: true, strict: true }) : null) ||
        file.replace('.md', '');

      const price = data.price || 0;
      const productDoc = {
        name: data.name || 'Untitled Product',
        slug,
        description: body || '',
        shortDescription: data.shortDescription || '',
        price,
        priceCents: Math.round(price * 100),
        currency: data.currency || 'INR',
        coverImage: data.coverImage || '/asset/assets/images/cover_placeholder.png',
        type: data.type || 'digital',
        status: data.status || 'published',
        tags: data.tags || ['demo'],
        category: data.category || 'Development',
        creator: creator._id,
        files: [],
        variants: [],
        customFields: {},
        salesCount: data.salesCount || 0,
        viewsCount: data.viewsCount || 0,
        avgRating: data.avgRating || 0,
        reviewCount: data.reviewCount || 0,
        revenue: 0,
        isFeatured: data.isFeatured !== undefined ? !!data.isFeatured : true,
        isArchived: false,
        maxPurchases: 0,
        callToAction: data.callToAction || 'I want this!',
        thankYouMessage: 'Thank you for purchasing! Enjoy your product.',
        requireShipping: false,
        publishedAt: new Date(),
        updatedAt: new Date(),
      };

      await productsCollection.updateOne(
        { slug },
        {
          $set: productDoc,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      console.log(`  ✔ Seeded: "${productDoc.name}" (/products/${slug})`);
      seededCount++;
    }

    console.log(`\n🎉 Successfully seeded ${seededCount} demo products into MongoDB!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
}

seedProducts();
