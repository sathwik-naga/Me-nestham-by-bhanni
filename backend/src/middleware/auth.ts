import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from './error';
import logger from '../utils/logger';

const userRepository = new UserRepository();

/**
 * Middleware to protect routes and verify the Supabase JWT
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization denied: Bearer token is missing', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authorization denied: Token is empty', 401);
    }

    // Verify token with Supabase and fetch authenticating user details
    const user = await userRepository.getUserByToken(token);
    if (!user) {
      throw new AppError('Authorization denied: Invalid or expired session token', 401);
    }

    // Retrieve role directly from verified Supabase Auth JWT app_metadata
    const role = (user.app_metadata?.role as 'customer' | 'admin') || 'customer';

    // Attach verified user credentials to Request object
    req.user = {
      id: user.id,
      email: user.email || '',
      role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const roleMiddleware = (...allowedRoles: ('customer' | 'admin')[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authorization required: User credentials not verified', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (Role: ${req.user.role}) trying to access roles: ${allowedRoles}`);
      next(new AppError('Forbidden: Access is denied for this user role', 403));
      return;
    }

    next();
  };
};
