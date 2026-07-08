import Razorpay from 'razorpay';
import { env } from './env';
import { logger } from '../utils/logger';

let razorpayInstance: Razorpay | null = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
} else {
  logger.warn('Razorpay keys not configured — payment features disabled');
}

export { razorpayInstance };
