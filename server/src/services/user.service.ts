import { User, IUser } from '../models/User.model';
import { ApiError } from '../utils/ApiError';

export class UserService {
  static async getById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async getByUsername(username: string): Promise<IUser> {
    const user = await User.findOne({ username, isBlocked: false });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async updateProfile(userId: string, updates: Partial<IUser>): Promise<IUser> {
    // Prevent updating sensitive fields directly
    const { role, isBlocked, ...safeUpdates } = updates as any;

    const user = await User.findByIdAndUpdate(userId, safeUpdates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async updatePaymentSettings(userId: string, settings: any): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { paymentSettings: settings },
      { new: true, runValidators: true }
    );
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async changePassword(_userId: string, _currentPassword: string, _newPassword: string): Promise<void> {
    throw ApiError.badRequest('Password management is handled via Clerk');
  }

  static async upgradeToCreator(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'creator' },
      { new: true }
    );
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }
}
