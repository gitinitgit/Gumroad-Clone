import { env } from './env';

export const emailConfig = {
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
};

export const emailDefaults = {
  from: env.EMAIL_FROM,
};
