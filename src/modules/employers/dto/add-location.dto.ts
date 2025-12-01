// src/modules/employers/dto/add-location.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for adding new employer location
 * UC-EMP-01: Thêm địa điểm văn phòng
 */
export class AddLocationDto {
  @ApiPropertyOptional({
    description: 'Là trụ sở chính',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'isHeadquarters phải là boolean' })
  isHeadquarters?: boolean;

  @ApiProperty({
    description: 'Tỉnh/Thành phố',
    example: 'TP. Hồ Chí Minh',
  })
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  @MaxLength(100, { message: 'Tỉnh/Thành phố tối đa 100 ký tự' })
  province: string;

  @ApiProperty({
    description: 'Quận/Huyện',
    example: 'Quận 1',
  })
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString({ message: 'Quận/Huyện phải là chuỗi' })
  @MaxLength(100, { message: 'Quận/Huyện tối đa 100 ký tự' })
  district: string;

  @ApiProperty({
    description: 'Địa chỉ chi tiết',
    example: '123 Nguyễn Huệ, Phường Bến Nghé',
  })
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  @IsString({ message: 'Địa chỉ chi tiết phải là chuỗi' })
  detailedAddress: string;
}
