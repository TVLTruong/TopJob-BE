export enum JobPostStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Chờ Admin duyệt bài đăng
  ACTIVE = 'ACTIVE', // Bài đăng đang hoạt động
  EXPIRED = 'EXPIRED', // Bài đăng đã hết hạn
  HIDDEN = 'HIDDEN', // Bài đăng bị ẩn
  DELETED = 'DELETED', // Bài đăng đã bị xóa
  REJECTED = 'REJECTED', // Bài đăng bị từ chối
  REMOVED_BY_ADMIN = 'REMOVED_BY_ADMIN', // Bài đăng bị gỡ bởi Admin
}
