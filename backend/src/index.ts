import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { testConnection } from './db/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';
import attendanceRoutes from './routes/attendances.js';
import reportRoutes from './routes/reports.js';
import planRoutes from './routes/plans.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/plans', planRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

start().catch(console.error);

export default app;