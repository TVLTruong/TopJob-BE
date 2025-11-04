import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  ValidateIf,
  IsOptional, // 👈 Thêm IsOptional
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum'; // (Bạn cần có file này)

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsEnum(UserRole, { message: 'Role must be either candidate or employer' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole.CANDIDATE | UserRole.EMPLOYER;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string; // Tên của Candidate HOẶC của Employer (người đại diện)

  // ValidateIf: Chỉ validate (bắt buộc) trường này NẾU role là 'employer'
  @ValidateIf((o) => o.role === UserRole.EMPLOYER)
  @IsString()
  @IsNotEmpty({ message: 'Company name is required for employers' })
  companyName: string; // 👈 Bỏ '?' vì đã có ValidateIf
}