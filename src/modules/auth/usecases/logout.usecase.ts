// src/auth/usecases/logout.usecase.ts

import { Injectable } from '@nestjs/common';

/**
 * UC-AUTH-02: Logout user.
 *
 * Handles server-side tasks on user logout.
 * For JWT: client deletes token; server can optionally log, revoke refresh tokens, or blacklist tokens.
 */
@Injectable()
export class LogoutUseCase {
  /**
   * Execute logout for a given user.
   * @param userId - ID of the user
   * @returns success message and redirect URL
   */
  execute(userId: string): Promise<{ message: string; redirectUrl: string }> {
    // Log the logout event or perform optional server-side tasks
    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);

    return Promise.resolve({
      message: 'Đăng xuất thành công',
      redirectUrl: '/',
    });
  }
}
