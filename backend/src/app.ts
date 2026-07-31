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

// Un-ratelimited System Health Checks (For monitoring / load balancers)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Sitemap XML Endpoints
app.use('/sitemap.xml', sitemapRoute);
app.use('/api/sitemap.xml', sitemapRoute);

// Apply General Rate Limiter to all API routes (200 req / 15 min)
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404 and forward to error handler
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Centralized error handler
app.use(errorHandler);

export default app;
