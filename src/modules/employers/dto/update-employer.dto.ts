import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsEmail,
  IsUrl,
} from 'class-validator';
import { CompanySize } from '../../../common/enums/company-size.enum';

export class UpdateEmployerDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  workTitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl() // Đảm bảo là URL
  @IsOptional()
  website?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsInt()
  @Min(1900)
  @IsOptional()
  foundedYear?: number;

  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @IsString()
  @IsOptional()
  taxCode?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  addressCity?: string;

  @IsString()
  @IsOptional()
  addressCountry?: string;
}