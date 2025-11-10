// Dùng để định nghĩa cột 'status' trong bảng 'users'
export enum UserStatus {
  PENDING = 'pending',
  VERIFIED = 'pending_email_verification', // Chờ xác minh email
  ACTIVE = 'active',
  BANNED = 'banned',
}
