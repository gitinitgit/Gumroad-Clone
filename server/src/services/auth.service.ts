import { User, IUser } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  hashToken,
} from '../utils/generateToken';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<{ user: IUser; tokens: AuthTokens }> {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Generate a unique username from email
    let username = input.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const existing = await User.findOne({ username });
    if (existing) {
      username = `${username}${Date.now().toString(36).slice(-4)}`;
    }

    const user = await User.create({
      ...input,
      username,
    });

    const tokens = await AuthService.generateTokens(user);
    return { user, tokens };
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.isBlocked) {
      throw ApiError.forbidden('Your account has been suspended. Contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = await AuthService.generateTokens(user);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return { user, tokens };
  }

  /**
   * Logout — remove specific refresh token
   */
  static async logout(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw ApiError.unauthorized('Refresh token not found');
    }

    // Remove old refresh token and generate new pair
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    const tokens = await AuthService.generateTokens(user);

    return tokens;
  }

  /**
   * Forgot password — generate reset token
   */
  static async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return 'If that email exists, a reset link has been sent';
    }

    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with resetToken
    return resetToken;
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();
  }

  /**
   * Generate access + refresh token pair, store refresh token in DB
   */
  private static async generateTokens(user: IUser): Promise<AuthTokens> {
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token (keep max 5 sessions)
    user.refreshTokens = user.refreshTokens || [];
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  }
}
