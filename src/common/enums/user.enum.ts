// User role enum
export enum UserRole {
  CANDIDATE = 'candidate',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
}

// User status enum
export enum UserStatus {
  PENDING_EMAIL_VERIFICATION = 'pending_email_verification', // CHỜ_XÁC_THỰC_EMAIL
  PENDING_PROFILE_COMPLETION = 'pending_profile_completion', // CHỜ_HOÀN_THIỆN_HỒ_SƠ (NTD only)
  PENDING_APPROVAL = 'pending_approval', // CHỜ_DUYỆT (NTD only)
  ACTIVE = 'active', // ĐANG_HOẠT_ĐỘNG
  BANNED = 'banned', // ĐÃ_KHÓA
}

// User status labels
export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.PENDING_EMAIL_VERIFICATION]: 'Chờ xác thực email',
  [UserStatus.PENDING_PROFILE_COMPLETION]: 'Chờ hoàn thiện hồ sơ',
  [UserStatus.PENDING_APPROVAL]: 'Chờ duyệt',
  [UserStatus.ACTIVE]: 'Đang hoạt động',
  [UserStatus.BANNED]: 'Đã khóa',
};

// User Role Labels
export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: 'Ứng viên',
  [UserRole.EMPLOYER]: 'Nhà tuyển dụng',
  [UserRole.ADMIN]: 'Quản trị viên',
};
