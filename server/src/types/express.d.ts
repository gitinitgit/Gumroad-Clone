import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    clerkId: string;
    role: string;
  };
}
