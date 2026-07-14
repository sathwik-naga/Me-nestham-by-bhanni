import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

const userRepository = new UserRepository();
const profileRepository = new ProfileRepository();
const authService = new AuthService(userRepository, profileRepository);

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, full_name } = req.body;
      const result = await authService.register(email, password, full_name);

      res.status(201).json({
        status: 'success',
        message: 'Account successfully registered',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      logger.info(`Received Authorization Header for logout: ${authHeader}`);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Authorization denied: Missing logout token', 400);
      }
      
      const token = authHeader.split(' ')[1];
      await authService.logout(token);

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: Session context missing', 401);
      }

      const profile = await authService.getCurrentProfile(req.user.id);

      res.status(200).json({
        status: 'success',
        data: {
          profile: {
            ...profile,
            email: req.user.email,
            role: req.user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
