// src/modules/users/dto/update-password.dto.ts

import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPassword } from '../../auth/validators/match-password.validator';

/**
 * DTO for updating password
 */
export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'OldPassword@123',
  })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  currentPassword: string;

  @ApiProperty({
    description:
      'Mật khẩu mới (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)',
    example: 'NewPassword@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Xác nhận mật khẩu mới (phải khớp với mật khẩu mới)',
    example: 'NewPassword@123',
  })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  @MatchPassword('newPassword', { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;
}
