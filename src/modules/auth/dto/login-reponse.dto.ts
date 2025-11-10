/**
 * Định nghĩa cấu trúc dữ liệu trả về sau khi đăng nhập thành công.
 * Bao gồm token và thông tin người dùng.
 */
export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    role: string;
    fullName: string;
    isFirstLogin: boolean;
    mustResetPassword: boolean;
    hasProfile: boolean;
  };
}
