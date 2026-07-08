import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { clerkMiddleware } from '@clerk/express';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { generalLimiter } from './middlewares/rateLimit.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { ApiError } from './utils/ApiError';
import { indexRouter } from './routes/index.routes';

const app = express();

// ─── Security ─────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// ─── Clerk session middleware (must be before routes) ─────
app.use(clerkMiddleware({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
}));

// ─── Body parsing ─────────────────────────────────────────
// Raw body for webhook signature verification
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Logging & Rate limiting ──────────────────────────────
app.use(requestLogger);
app.use('/api/', generalLimiter);

// ─── Static files (uploads) ──────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/v1', indexRouter);

// ─── Health check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});



// ─── 404 Handler ──────────────────────────────────────────
app.use((_req, _res, next) => {
  next(ApiError.notFound('Route not found'));
});

// ─── Central Error Handler ────────────────────────────────
app.use(errorMiddleware);

export default app;
