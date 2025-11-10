// Dùng để định nghĩa cột 'status' trong bảng 'Employers'
export enum EmployerProfileStatus {
  DRAFT = 'draft', // Hồ sơ chưa đầy đủ
  PENDING_APPROVAL = 'pending_approval', // Lần đầu gửi admin duyệt
  ACTIVE = 'active', // Được duyệt
  PENDING_UPDATE_APPROVAL = 'pending_update_approval', // Chỉnh sửa chờ duyệt
  REJECTED = 'rejected', // Bị admin từ chối
}
