import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';

const userRepository = new UserRepository();
const profileRepository = new ProfileRepository();

/**
 * Optional authentication middleware:
 * Attaches verified user credentials to request if valid JWT is present,
 * but allows unauthenticated guest requests to proceed.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const user = await userRepository.getUserByToken(token).catch(() => null);
        if (user) {
          const profile = await profileRepository.getById(user.id).catch(() => null);
          req.user = {
            id: user.id,
            email: user.email || '',
            role: profile?.role || 'customer',
          };
        }
      }
    }
  } catch {
    // Silently continue for optional auth
  } finally {
    next();
  }
};
