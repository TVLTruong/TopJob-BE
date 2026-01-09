// src/common/dto/id-param.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
// (Nếu ID của bạn là 'number', hãy dùng 'IsNumberString')

export class IdParamDto {
  @IsString() // (Hoặc @IsNumberString() nếu ID là số)
  @IsNotEmpty()
  id: string;
}
