// src/common/enums/employer.enum.ts

/**
 * Employer Status Enum
 * Specific status for employer accounts
 * Based on Use Cases: UCEMP01, UCADM01
 */
export enum EmployerStatus {
  PENDING_APPROVAL = 'pending_approval', // Chờ admin duyệt
  ACTIVE = 'active', // Đã duyệt, hoạt động
  BANNED = 'banned', // Bị khóa
}

/**
 * Employer Profile Status Enum
 * Tracks pending edits that need approval
 * Based on Use Case: UCEMP02
 */
export enum EmployerProfileStatus {
  APPROVED = 'approved', // Hồ sơ đã duyệt
  PENDING_EDIT_APPROVAL = 'pending_edit_approval', // Chỉnh sửa đang chờ duyệt
}

/**
 * Company Size Enum
 */
export enum CompanySize {
  STARTUP = 'startup', // 1-10 nhân viên
  SMALL = 'small', // 11-50 nhân viên
  MEDIUM = 'medium', // 51-200 nhân viên
  LARGE = 'large', // 201-1000 nhân viên
  ENTERPRISE = 'enterprise', // 1000+ nhân viên
}

/**
 * Employer Status Labels (for display)
 */
export const EmployerStatusLabel: Record<EmployerStatus, string> = {
  [EmployerStatus.PENDING_APPROVAL]: 'Chờ duyệt',
  [EmployerStatus.ACTIVE]: 'Đang hoạt động',
  [EmployerStatus.BANNED]: 'Đã khóa',
};

/**
 * Employer Profile Status Labels (for display)
 */
export const EmployerProfileStatusLabel: Record<EmployerProfileStatus, string> =
  {
    [EmployerProfileStatus.APPROVED]: 'Đã duyệt',
    [EmployerProfileStatus.PENDING_EDIT_APPROVAL]: 'Chờ duyệt chỉnh sửa',
  };

/**
 * Company Size Labels (for display)
 */
export const CompanySizeLabel: Record<CompanySize, string> = {
  [CompanySize.STARTUP]: '1-10 nhân viên',
  [CompanySize.SMALL]: '11-50 nhân viên',
  [CompanySize.MEDIUM]: '51-200 nhân viên',
  [CompanySize.LARGE]: '201-1000 nhân viên',
  [CompanySize.ENTERPRISE]: 'Hơn 1000 nhân viên',
};

/**
 * Company Size Range
 */
export const CompanySizeRange: Record<
  CompanySize,
  { min: number; max: number | null }
> = {
  [CompanySize.STARTUP]: { min: 1, max: 10 },
  [CompanySize.SMALL]: { min: 11, max: 50 },
  [CompanySize.MEDIUM]: { min: 51, max: 200 },
  [CompanySize.LARGE]: { min: 201, max: 1000 },
  [CompanySize.ENTERPRISE]: { min: 1001, max: null },
};
