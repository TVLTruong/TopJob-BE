import { IsNotEmpty, IsString } from 'class-validator';
import { User } from '../../users/entities/user.entity';

export class CreateEmployerDto {
  @IsNotEmpty()
  user: User;

  @IsString()
  @IsNotEmpty()
  fullName: string; // Tên người đại diện

  @IsString()
  @IsNotEmpty()
  companyName: string; // Tên công ty
}