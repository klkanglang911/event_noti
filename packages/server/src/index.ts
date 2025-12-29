import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Initialize database
import './db/index.ts';

// Import routes
import routes from './routes/index.ts';

// Import schedulers
import { startScheduler } from './scheduler/index.ts';
import { startExpireScheduler } from './scheduler/expireEvents.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  } : false,
}));
app.use(cors({
  origin: isProduction
    ? process.env.FRONTEND_URL || true
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (isProduction) {
  const webDistPath = path.join(__dirname, '../../web/dist');

  app.use(express.static(webDistPath));

  // SPA fallback - serve index.html for all non-API routes
  // Express 5 uses path-to-regexp 8.x which requires {*path} syntax instead of *
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
      success: false,
    });
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    success: false,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EventNoti API Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start schedulers
  startScheduler();
  startExpireScheduler();
});
