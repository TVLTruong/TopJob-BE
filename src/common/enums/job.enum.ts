// src/common/enums/job.enum.ts

/**
 * Job Status Enum
 * Tracks the lifecycle status of a job posting
 * Based on Use Cases: UCEMP03-04, UCADM02, UCADM05
 */
export enum JobStatus {
  DRAFT = 'draft', // Nháp (chưa gửi duyệt)
  PENDING_APPROVAL = 'pending_approval', // Chờ admin duyệt (UCADM02)
  ACTIVE = 'active', // Đang hoạt động (đã duyệt)
  EXPIRED = 'expired', // Hết hạn
  CLOSED = 'closed', // Đã đủ người/đóng
  HIDDEN = 'hidden', // Ẩn bởi NTD (UCEMP04)
  REJECTED = 'rejected', // Bị admin từ chối (UCADM02)
  REMOVED_BY_ADMIN = 'removed_by_admin', // Gỡ bởi admin (UCADM05)
  REMOVED_BY_EMPLOYER = 'removed_by_employer', // Xóa bởi employer (UCEMP04)
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
  CONTRACT = 'contract', // Hợp đồng
}

export enum WorkMode {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum ExperienceLevel {
  INTERN = 'intern',
  FRESHER = 'fresher',
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
}

/**
 * Job Status Labels (for display)
 */
export const JobStatusLabel: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: 'Bản nháp',
  [JobStatus.PENDING_APPROVAL]: 'Chờ duyệt',
  [JobStatus.ACTIVE]: 'Đang hoạt động',
  [JobStatus.EXPIRED]: 'Hết hạn',
  [JobStatus.CLOSED]: 'Đã đóng',
  [JobStatus.HIDDEN]: 'Đã ẩn',
  [JobStatus.REJECTED]: 'Bị từ chối',
  [JobStatus.REMOVED_BY_ADMIN]: 'Đã gỡ bởi admin',
  [JobStatus.REMOVED_BY_EMPLOYER]: 'Đã xóa bởi nhà tuyển dụng',
};

/**
 * Job Type Labels (for display)
 */
export const JobTypeLabel: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Toàn thời gian',
  [JobType.PART_TIME]: 'Bán thời gian',
  [JobType.FREELANCE]: 'Freelance',
  [JobType.INTERNSHIP]: 'Thực tập',
  [JobType.CONTRACT]: 'Hợp đồng',
};

export const WorkModeLabel: Record<WorkMode, string> = {
  [WorkMode.ONSITE]: 'Làm việc tại văn phòng',
  [WorkMode.REMOTE]: 'Làm việc từ xa',
  [WorkMode.HYBRID]: 'Làm việc kết hợp',
};

export const ExperienceLevelLabel: Record<ExperienceLevel, string> = {
  [ExperienceLevel.INTERN]: 'Thực tập',
  [ExperienceLevel.FRESHER]: 'Mới tốt nghiệp',
  [ExperienceLevel.JUNIOR]: 'Cấp thấp',
  [ExperienceLevel.MIDDLE]: 'Cấp trung',
  [ExperienceLevel.SENIOR]: 'Cấp cao',
  [ExperienceLevel.LEAD]: 'Trưởng nhóm',
  [ExperienceLevel.MANAGER]: 'Quản lý',
};
