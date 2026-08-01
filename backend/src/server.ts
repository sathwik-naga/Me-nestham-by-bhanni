import app from './app';
import env from './config/env';
import logger from './utils/logger';
import { checkDatabaseHealth } from './utils/dbHealthCheck';
import { cronMaintenance } from './services/cron.service';

let server: any;

export const bootstrap = async (): Promise<void> => {
  if (server) {
    logger.warn('Server already started – ignoring duplicate bootstrap call.');
    return;
  }
  try {
    await checkDatabaseHealth();
  } catch (err) {
    logger.error(`Database health check failed: ${err}`);
  }

  // Start background maintenance engine (Module 6)
  cronMaintenance.startMaintenanceEngine();

  server = app.listen(env.PORT, () => {
    logger.info(`⚡️ Server is running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

if (require.main === module) {
  bootstrap();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
  logger.error(err.stack || err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  logger.error(err.stack || err.message);
  process.exit(1);
});

// Handle graceful shutdown on system termination signals
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('Process terminated.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
