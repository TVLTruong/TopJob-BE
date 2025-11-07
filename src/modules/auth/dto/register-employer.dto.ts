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
  @MinLength(2)
  fullName: string;

  @IsEmail()
  workEmail: string;

  @IsPhoneNumber('VN', {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567)',
  })
  phone: string;

  @IsString()
  @MinLength(2)
  position: string;

  @IsString()
  @MinLength(2)
  companyName: string;

  @IsString()
  city: string;

  @IsString()
  ward: string;

  @IsString()
  streetAddress: string;

  @IsUrl({}, { message: 'Website không hợp lệ' })
  @IsOptional()
  website?: string;
}
