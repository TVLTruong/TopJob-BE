// src/auth/usecases/logout.usecase.ts

import { Injectable } from '@nestjs/common';

/**
 * Use Case: UC-AUTH-02 - Đăng xuất
 *
 * Main Flow:
 * 1. User clicks "Logout"
 * 2. System destroys login session (session/token)
 * 3. System redirects user to Landing Page
 *
 * Alternative Flows: None
 *
 * Note: For JWT-based authentication, logout is primarily handled client-side
 * by removing the token. The server can optionally maintain a blacklist of
 * invalidated tokens for additional security.
 */
@Injectable()
export class LogoutUseCase {
  /**
   * Execute logout use case
   * UC-AUTH-02: Logout user
   *
   * Note: In JWT authentication, the actual logout is handled client-side
   * by removing the token from storage. This method can be used for:
   * - Logging logout events
   * - Invalidating refresh tokens (if implemented)
   * - Adding token to blacklist (if implemented)
   *
   * @param userId - ID of user logging out
   * @returns Success message
   */
  execute(userId: string): { message: string; redirectUrl: string } {
    // Step 1-2: Destroy session
    // In JWT-based auth, client removes token
    // Server-side: Can add token to blacklist, revoke refresh tokens, etc.

    // TODO: Optional - Add to token blacklist
    // TODO: Optional - Revoke refresh tokens
    // TODO: Optional - Log logout event

    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);

    // Step 3: Return redirect URL
    return {
      message: 'Đăng xuất thành công',
      redirectUrl: '/',
    };
  }
}
