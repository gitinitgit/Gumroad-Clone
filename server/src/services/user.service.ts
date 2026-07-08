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
    const { password, role, isBlocked, refreshTokens, ...safeUpdates } = updates as any;

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

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();
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
