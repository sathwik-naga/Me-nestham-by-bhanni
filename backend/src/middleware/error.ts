import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Check if error is an instance of AppError
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    logger.warn(`Validation Error: ${req.originalUrl} - ${req.method} - ${JSON.stringify(err.errors)}`);
    res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle unexpected programming errors (500 Internal Server Error)
  logger.error(`Unhandled Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};
