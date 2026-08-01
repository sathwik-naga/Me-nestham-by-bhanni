import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import logger from './utils/logger';
import { registerSecurityMiddleware, corsSecurityMiddleware } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, AppError } from './middleware/error';

// Route Handlers
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import shippingRoutes from './routes/shipping.routes';
import emailRoutes from './routes/email.routes';
import promotionRoutes from './routes/promotion.routes';
import adminRoutes from './routes/admin.routes';
import contactRoutes from './routes/contact.routes';
import sitemapRoute from './routes/sitemap.route';

import observabilityRoutes from './modules/observability/observability.routes';

import { maintenanceMiddleware } from './middleware/maintenance.middleware';

const app: Express = express();

// Register Central Security Hardening (Trust Proxy, Disable X-Powered-By, Helmet, CORS, Compression Filter, HPP, 1MB JSON)
registerSecurityMiddleware(app);

// Explicit OPTIONS preflight handler for all routes
app.options('*', corsSecurityMiddleware);

// Morgan HTTP request logging integrated with Winston logger
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);
app.use(morganMiddleware);

// Production Root Health Check Endpoints (For Render Deployment Health Checks)
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'Me Nestham By Bhanni Backend',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'production',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.head('/', (_req: Request, res: Response) => {
  res.status(200).end();
});

// Maintenance Mode Safeguard (Phase 5.7)
app.use(maintenanceMiddleware);

// Un-ratelimited System Health Checks & Observability Endpoints (For load balancers / monitoring)
app.use('/', observabilityRoutes);

// Sitemap XML Endpoints
app.use('/sitemap.xml', sitemapRoute);
app.use('/api/sitemap.xml', sitemapRoute);

// Apply General Rate Limiter to all API routes (200 req / 15 min)
app.use('/api', apiLimiter);
app.use('/api/v1', apiLimiter);

// API v1 Versioning Aliases & Routes (Phase 5.7)
app.use(['/api', '/api/v1'], observabilityRoutes);
app.use(['/api/auth', '/api/v1/auth'], authRoutes);
app.use(['/api/categories', '/api/v1/categories'], categoryRoutes);
app.use(['/api/products', '/api/v1/products'], productRoutes);
app.use(['/api/cart', '/api/v1/cart'], cartRoutes);
app.use(['/api/orders', '/api/v1/orders'], orderRoutes);
app.use(['/api/payments', '/api/v1/payments'], paymentRoutes);
app.use(['/api/shipping', '/api/v1/shipping'], shippingRoutes);
app.use(['/api/emails', '/api/v1/emails'], emailRoutes);
app.use(['/api/promotions', '/api/v1/promotions'], promotionRoutes);
app.use(['/api/contact', '/api/v1/contact'], contactRoutes);
app.use(['/api/admin', '/api/v1/admin'], adminRoutes);

// Catch 404 and forward to error handler
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Centralized error handler
app.use(errorHandler);

export default app;
