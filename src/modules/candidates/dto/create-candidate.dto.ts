import { IsNotEmpty, IsString } from 'class-validator';
import { User } from '../../users/entities/user.entity';

/**
 * DTO này được dùng nội bộ bởi AuthService
 * khi một user mới đăng ký với role 'candidate'
 */
export class CreateCandidateDto {
  // Bắt buộc phải có user (để gán quan hệ)
  @IsNotEmpty()
  user: User;

  // Bắt buộc phải có full_name (vì trong SQL là NOT NULL)
  @IsString()
  @IsNotEmpty()
  fullName: string;
}