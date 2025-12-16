/**
 * Express Type Definitions
 * Global type augmentation for Express Request with authenticated user
 */

import { UserRole, UserStatus } from '../enums';

/**
 * Authenticated User Interface
 * Represents the authenticated user attached to Express Request
 */
export interface AuthenticatedUser {
  /**
   * User ID from JWT sub claim
   */
  id: string;

  /**
   * User role for authorization
   */
  role: UserRole;

  /**
   * User account status
   */
  status: UserStatus;
}

/**
 * Extend Express Request to include authenticated user
 * This makes request.user available with proper typing throughout the app
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user populated by JwtAuthGuard
       * Available after successful JWT authentication
       */
      user?: AuthenticatedUser;
    }
  }
}
