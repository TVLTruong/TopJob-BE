// Dùng để định nghĩa cột 'status' trong bảng 'Employers'
export enum ProfileStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Chờ Admin duyệt hồ sơ
  REJECTED = 'REJECTED', // Hồ sơ bị từ chối
  APPROVED = 'APPROVED', // Hồ sơ đã được phê duyệt
  PENDING_EDIT_APPROVAL = 'PENDING_EDIT_APPROVAL', // Chờ phê duyệt chỉnh sửa hồ sơ
}
