import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { configurePassport } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import commonIssueRoutes from './routes/commonIssueRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import technicalRoutes from './routes/technicalRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export const createApp = (mongoUri) => {
  const app = express();

  // Render terminates TLS at its reverse proxy, so Express must trust its
  // forwarded protocol before issuing secure production session cookies.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Cross-Origin Resource Sharing with Credentials
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static files for attachments
  app.use('/uploads', express.static(path.resolve('public/uploads')));

  // MongoDB-backed Session Store
  const sessionSecret = process.env.SESSION_SECRET || 'smart_grievance_portal_secret_2026';
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60, // 14 days
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // Passport Authentication
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Smart Grievance Portal API',
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/grievances', grievanceRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/common-issues', commonIssueRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/workers', workerRoutes);
  app.use('/api/technical', technicalRoutes);

  // Static frontend serving if client/dist exists
  const clientDist = path.resolve('../client/dist');
  app.use(express.static(clientDist));

  // Client-side routing fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path === '/health'
    ) {
      return next();
    }
    const indexPath = path.join(clientDist, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  });

  // Centralized Error Handling for API routes
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
