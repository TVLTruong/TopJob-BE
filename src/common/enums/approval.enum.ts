// src/common/enums/approval.enum.ts

/**
 * Approval Action Enum
 * Admin's decision on approval requests
 * Based on Use Cases: UCADM01-02
 */
export enum ApprovalAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Approval Target Type Enum
 * What type of entity is being approved
 */
export enum ApprovalTargetType {
  EMPLOYER_PROFILE = 'employer_profile', // UCADM01: Hồ sơ NTD
  EMPLOYER_PROFILE_EDIT = 'employer_profile_edit', // UCEMP02: Chỉnh sửa hồ sơ NTD
  JOB_POST = 'job_post', // UCADM02: Tin tuyển dụng
}

/**
 * Approval Action Labels (for display)
 */
export const ApprovalActionLabel: Record<ApprovalAction, string> = {
  [ApprovalAction.APPROVED]: 'Đã duyệt',
  [ApprovalAction.REJECTED]: 'Đã từ chối',
};

/**
 * Approval Target Type Labels (for display)
 */
export const ApprovalTargetTypeLabel: Record<ApprovalTargetType, string> = {
  [ApprovalTargetType.EMPLOYER_PROFILE]: 'Hồ sơ nhà tuyển dụng',
  [ApprovalTargetType.EMPLOYER_PROFILE_EDIT]: 'Chỉnh sửa hồ sơ',
  [ApprovalTargetType.JOB_POST]: 'Tin tuyển dụng',
};
