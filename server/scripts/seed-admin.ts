import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gumroad-clone';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email: 'admin@gumroad-clone.com' });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    await usersCollection.insertOne({
      name: 'Admin',
      email: 'admin@gumroad-clone.com',
      password: hashedPassword,
      username: 'admin',
      role: 'admin',
      avatar: '/assets/images/gumroad-default-avatar-5.png',
      bio: 'Platform administrator',
      socialLinks: {},
      paymentSettings: {},
      notificationSettings: {
        emailOnSale: true,
        emailOnReview: true,
        emailOnPayout: true,
        pushEnabled: true,
      },
      isVerified: true,
      isBlocked: false,
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Admin user created: admin@gumroad-clone.com / Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedAdmin();
