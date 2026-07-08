import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types/express.d';

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserService.getById(req.user!.userId);
  ApiResponse.success(res, user, 'User profile retrieved');
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserService.updateProfile(req.user!.userId, req.body);
  ApiResponse.success(res, user, 'Profile updated');
});

export const getPublicProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserService.getByUsername(req.params.username);
  ApiResponse.success(res, {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    socialLinks: user.socialLinks,
  }, 'Public profile retrieved');
});

export const updatePaymentSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserService.updatePaymentSettings(req.user!.userId, req.body);
  ApiResponse.success(res, user, 'Payment settings updated');
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await UserService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  ApiResponse.success(res, null, 'Password changed successfully');
});

export const upgradeToCreator = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserService.upgradeToCreator(req.user!.userId);
  ApiResponse.success(res, user, 'Account upgraded to creator');
});
