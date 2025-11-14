// src/common/enums/job.enum.ts

/**
 * Job Status Enum
 * Tracks the lifecycle status of a job posting
 * Based on Use Cases: UCEMP03-04, UCADM02, UCADM05
 */
export enum JobStatus {
  //   DRAFT = 'draft', // Nháp (chưa gửi duyệt)
  PENDING_APPROVAL = 'pending_approval', // Chờ admin duyệt (UCADM02)
  ACTIVE = 'active', // Đang hoạt động (đã duyệt)
  EXPIRED = 'expired', // Hết hạn
  CLOSED = 'closed', // Đã đủ người/đóng
  HIDDEN = 'hidden', // Ẩn bởi NTD (UCEMP04)
  REJECTED = 'rejected', // Bị admin từ chối (UCADM02)
  REMOVED_BY_ADMIN = 'removed_by_admin', // Gỡ bởi admin (UCADM05)
}

/**
 * Job Type Enum
 * Hình thức làm việc
 */
export enum JobType {
  FULL_TIME = 'full_time', // Toàn thời gian
  PART_TIME = 'part_time', // Bán thời gian
  FREELANCE = 'freelance', // Tự do
  INTERNSHIP = 'internship', // Thực tập
  REMOTE = 'remote', // Làm từ xa
}

/**
 * Job Status Labels (for display)
 */
export const JobStatusLabel: Record<JobStatus, string> = {
  //   [JobStatus.DRAFT]: 'Bản nháp',
  [JobStatus.PENDING_APPROVAL]: 'Chờ duyệt',
  [JobStatus.ACTIVE]: 'Đang hoạt động',
  [JobStatus.EXPIRED]: 'Hết hạn',
  [JobStatus.CLOSED]: 'Đã đóng',
  [JobStatus.HIDDEN]: 'Đã ẩn',
  [JobStatus.REJECTED]: 'Bị từ chối',
  [JobStatus.REMOVED_BY_ADMIN]: 'Đã gỡ bởi admin',
};

/**
 * Job Type Labels (for display)
 */
export const JobTypeLabel: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Toàn thời gian',
  [JobType.PART_TIME]: 'Bán thời gian',
  [JobType.FREELANCE]: 'Freelance',
  [JobType.INTERNSHIP]: 'Thực tập',
  [JobType.REMOTE]: 'Làm từ xa',
};
