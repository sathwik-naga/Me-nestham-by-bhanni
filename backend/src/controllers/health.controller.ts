import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export const getHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let dbStatus = 'healthy';
    let dbError: string | null = null;

    // Ping Supabase to check connectivity
    try {
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (error) {
        dbStatus = 'unhealthy';
        dbError = error.message;
        logger.error(`Database health check failed: ${error.message}`);
      }
    } catch (err: unknown) {
      dbStatus = 'unhealthy';
      dbError = err instanceof Error ? err.message : 'Unknown database connection error';
      logger.error(`Database connectivity error: ${dbError}`);
    }

    const healthStatus = {
      status: dbStatus === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          error: dbError,
        },
      },
    };

    res.status(dbStatus === 'healthy' ? 200 : 503).json(healthStatus);
  } catch (error) {
    next(error);
  }
};
