import { Request, Response, NextFunction } from 'express';
import { roleMiddleware } from './auth';

/**
 * Middleware to restrict route access exclusively to administrators
 */
export const adminMiddleware = roleMiddleware('admin');
