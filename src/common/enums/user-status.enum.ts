// Dùng để định nghĩa cột 'status'
export enum UserStatus {
  PENDING = 'pending',
  VERIFIED = 'verified', // trạng thái đã xác thực chờ duyệt của employer
  ACTIVE = 'active',
  BANNED = 'banned',
}
