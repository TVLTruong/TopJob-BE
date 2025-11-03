import { UserRole } from '../enums/user-role.enum'; // Đảm bảo bạn có file enum này

// Dùng tên 'RequestUser' mà nhóm bạn đã thống nhất
export interface RequestUser {
  sub: number;   // 👈 'sub' (subject) là nơi lưu ID (là number)
  email: string;
  role: UserRole;  // 👈 Dùng Enum (tốt hơn là 'string')
}