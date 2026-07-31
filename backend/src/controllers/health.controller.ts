import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export const getHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let isConnected = true;

    try {
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (error) {
        isConnected = false;
        logger.error(`Database health check failed: ${error.message}`);
      }
    } catch (err: any) {
      isConnected = false;
      logger.error(`Database connectivity exception: ${err?.message || err}`);
    }

    const payload = {
      status: isConnected ? 'ok' : 'degraded',
      database: isConnected ? 'connected' : 'disconnected',
      version: '1.0.0',
    };

    res.status(isConnected ? 200 : 503).json(payload);
  } catch (error) {
    next(error);
  }
};
