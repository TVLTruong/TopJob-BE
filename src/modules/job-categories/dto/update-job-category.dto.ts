import { PartialType } from '@nestjs/mapped-types';
import { CreateJobCategoryDto } from './create-job-category.dto';

// Tự động kế thừa tất cả các trường từ Create DTO
// và biến chúng thành tùy chọn (optional)
export class UpdateJobCategoryDto extends PartialType(CreateJobCategoryDto) {}