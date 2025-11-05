import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user-employer.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateUserDto extends PartialType(CreateUserDto) {}