import mongoose, { Document, Schema, Model } from 'mongoose';
import { ROLES } from '../constants/roles';

export interface IUser extends Document {
  clerkId: string;
  name: string;
  email: string;
  username: string;
  role: string;
  avatar: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    website?: string;
    youtube?: string;
  };
  paymentSettings: {
    razorpayAccountId?: string;
    upiId?: string;
    bankAccountName?: string;
  };
  notificationSettings: {
    emailOnSale: boolean;
    emailOnReview: boolean;
    emailOnPayout: boolean;
    pushEnabled: boolean;
  };
  isVerified: boolean;
  isBlocked: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.BUYER,
    },
    avatar: {
      type: String,
      default: '/assets/images/gumroad-default-avatar-5.png',
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    socialLinks: {
      twitter: String,
      website: String,
      youtube: String,
    },
    paymentSettings: {
      razorpayAccountId: String,
      upiId: String,
      bankAccountName: String,
    },
    notificationSettings: {
      emailOnSale: { type: Boolean, default: true },
      emailOnReview: { type: Boolean, default: true },
      emailOnPayout: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true },
    },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const result = { ...ret } as Record<string, any>;
        delete result.__v;
        return result;
      },
    },
  }
);

// Index for text search
userSchema.index({ name: 'text', email: 'text', username: 'text' });

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
