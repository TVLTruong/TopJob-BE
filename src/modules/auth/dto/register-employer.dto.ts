import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsUrl,
  IsOptional,
  MinLength,
} from 'class-validator';

export class RegisterEmployerDto {
  @IsString()
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  workEmail: string;

  @IsPhoneNumber('VN', {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567)',
  })
  phone: string;

  @IsString()
  @MinLength(2, { message: 'Chức vụ phải có ít nhất 2 ký tự' })
  workTitle: string;

  @IsString()
  @MinLength(2, { message: 'Tên công ty phải có ít nhất 2 ký tự' })
  companyName: string;

  @IsString()
  @MinLength(2, { message: 'Tên thành phố không được rỗng' })
  city: string;

  @IsString()
  @MinLength(2, { message: 'Tên phường/xã không được rỗng' })
  ward: string;

  @IsString()
  @MinLength(5, { message: 'Địa chỉ không được rỗng' })
  streetAddress: string;

  @IsUrl({}, { message: 'Website không hợp lệ' })
  @IsOptional()
  website?: string;
}
