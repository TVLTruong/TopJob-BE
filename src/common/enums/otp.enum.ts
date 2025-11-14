// src/common/enums/otp.enum.ts

/**
 * OTP Purpose Enum
 * Defines the purpose of OTP verification
 * Based on Use Cases: UCCORE01, UCREG03, UCAUTH03
 */
export enum OtpPurpose {
  EMAIL_VERIFICATION = 'email_verification', // UCREG03: Xác thực email đăng ký
  PASSWORD_RESET = 'password_reset', // UCAUTH03: Đặt lại mật khẩu
  EMAIL_CHANGE = 'email_change', // Xác thực khi đổi email
}

/**
 * OTP Purpose Labels (for display)
 */
export const OtpPurposeLabel: Record<OtpPurpose, string> = {
  [OtpPurpose.EMAIL_VERIFICATION]: 'Xác thực email',
  [OtpPurpose.PASSWORD_RESET]: 'Đặt lại mật khẩu',
  [OtpPurpose.EMAIL_CHANGE]: 'Thay đổi email',
};

/**
 * OTP Expiry Time (in minutes)
 */
export const OtpExpiryTime: Record<OtpPurpose, number> = {
  [OtpPurpose.EMAIL_VERIFICATION]: 5,
  [OtpPurpose.PASSWORD_RESET]: 10,
  [OtpPurpose.EMAIL_CHANGE]: 5,
};

/**
 * OTP Length
 */
export const OTP_LENGTH = 6;

/**
 * OTP Max Attempts
 */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * OTP Rate Limit (requests per hour)
 */
export const OTP_RATE_LIMIT = 5;
