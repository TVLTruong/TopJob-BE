// Dùng để định nghĩa cột 'status' trong bảng 'users'
export enum UserStatus {
  PENDING_EMAIL_VERIFICATION = 'pending_email_verification', // Chờ xác thực email
  PENDING_PROFILE_COMPLETION = 'pending_profile_completion', // Chờ NTD hoàn thiện hồ sơ
  PENDING_APPROVAL = 'pending_approval', // Chờ Admin duyệt hồ sơ
  ACTIVE = 'active', // Đang hoạt động
  BANNED = 'banned', // Đã bị khóa
}
