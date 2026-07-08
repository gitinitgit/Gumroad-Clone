import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
import { ApiError } from '../utils/ApiError';
import { ROLES, Role } from '../constants/roles';

/**
 * Restrict access to admin users only.
 * Must be used after authMiddleware.
 */
export const adminMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Admin access required');
  }
  next();
};

/**
 * Restrict access to creator or admin users.
 */
export const creatorMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== ROLES.CREATOR && req.user.role !== ROLES.ADMIN)) {
    throw ApiError.forbidden('Creator access required');
  }
  next();
};

/**
 * Create a role-checking middleware for any set of roles.
 */
export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      throw ApiError.forbidden(`Access requires one of: ${roles.join(', ')}`);
    }
    next();
  };
};
