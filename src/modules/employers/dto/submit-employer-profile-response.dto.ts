// src/modules/employers/dto/submit-employer-profile-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { EmployerProfileResponseDto } from './employer-profile-response.dto';

export class SubmitEmployerProfileResponseDto {
  @ApiProperty({
    description: 'Hồ sơ nhà tuyển dụng sau khi gửi',
    type: EmployerProfileResponseDto,
  })
  profile: EmployerProfileResponseDto;

  @ApiProperty({
    description: 'Thông điệp hướng dẫn logout',
    default: 'Đã gửi hồ sơ thành công. Vui lòng đăng nhập lại.',
  })
  message: string;

  @ApiProperty({
    description: 'Cờ yêu cầu client xóa token hiện tại',
    default: true,
  })
  shouldLogout: boolean;

  @ApiProperty({
    description: 'URL gợi ý sau khi logout',
    default: '/auth/login',
  })
  redirectUrl: string;
}

