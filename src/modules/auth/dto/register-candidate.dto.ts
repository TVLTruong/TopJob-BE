// src/modules/auth/dto/register-candidate.dto.ts
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterCandidateDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*])/, {
    message: 'Mật khẩu phải có chữ hoa, chữ thường và số hoặc ký tự đặc biệt.',
  })
  password: string;
}
