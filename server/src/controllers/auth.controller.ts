import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types/express.d';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await AuthService.register(req.body);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  ApiResponse.created(res, {
    user,
    accessToken: tokens.accessToken,
  }, 'Account created successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await AuthService.login(email, password);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.success(res, {
    user,
    accessToken: tokens.accessToken,
  }, 'Login successful');
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (req.user && refreshToken) {
    await AuthService.logout(req.user.userId, refreshToken);
  }

  res.clearCookie('refreshToken');
  ApiResponse.success(res, null, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    return ApiResponse.error(res, 401, 'Refresh token required');
  }

  const tokens = await AuthService.refreshToken(token);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.success(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body.email);
  ApiResponse.success(res, { resetToken: result }, 'Reset instructions sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.password);
  ApiResponse.success(res, null, 'Password reset successful');
});
