// src/common/enums/application.enum.ts

/**
 * Application Status Enum
 * Tracks the lifecycle of a job application
 * Based on Use Cases: UCCAN04-06, UCEMP05-06
 */
export enum ApplicationStatus {
  NEW = 'new', // MỚI (vừa nộp)
  VIEWED = 'viewed', // ĐÃ XEM (NTD đã xem)
  SHORTLISTED = 'shortlisted', // PHÙ HỢP (được chọn)
  REJECTED = 'rejected', // TỪ CHỐI
  HIRED = 'hired', // ĐÃ TUYỂN
  WITHDRAWN = 'withdrawn', // RÚT HỒ SƠ (ứng viên tự rút)
}

/**
 * Application Status Labels (for display)
 */
export const ApplicationStatusLabel: Record<ApplicationStatus, string> = {
  [ApplicationStatus.NEW]: 'Mới',
  [ApplicationStatus.VIEWED]: 'Đã xem',
  [ApplicationStatus.SHORTLISTED]: 'Phù hợp',
  [ApplicationStatus.REJECTED]: 'Từ chối',
  [ApplicationStatus.HIRED]: 'Đã tuyển',
  [ApplicationStatus.WITHDRAWN]: 'Đã rút',
};

/**
 * Application Status for Candidate View
 * (Different labels for better UX)
 */
export const ApplicationStatusCandidateLabel: Record<
  ApplicationStatus,
  string
> = {
  [ApplicationStatus.NEW]: 'Đã nộp',
  [ApplicationStatus.VIEWED]: 'Nhà tuyển dụng đã xem',
  [ApplicationStatus.SHORTLISTED]: 'Bạn được quan tâm',
  [ApplicationStatus.REJECTED]: 'Không phù hợp',
  [ApplicationStatus.HIRED]: 'Chúc mừng! Bạn đã được tuyển',
  [ApplicationStatus.WITHDRAWN]: 'Đã rút hồ sơ',
};

/**
 * Application Status for Employer View
 */
export const ApplicationStatusEmployerLabel: Record<ApplicationStatus, string> =
  {
    [ApplicationStatus.NEW]: 'Hồ sơ mới',
    [ApplicationStatus.VIEWED]: 'Đã xem',
    [ApplicationStatus.SHORTLISTED]: 'Ứng viên tiềm năng',
    [ApplicationStatus.REJECTED]: 'Đã từ chối',
    [ApplicationStatus.HIRED]: 'Đã tuyển',
    [ApplicationStatus.WITHDRAWN]: 'Ứng viên rút',
  };
