// src/common/dto/slug-param.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class SlugParamDto {
  @IsString()
  @IsNotEmpty()
  slug: string;
}