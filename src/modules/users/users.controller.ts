import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  // (Nên thêm UseGuards, Roles... ở đây để bảo vệ)
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum'; // 👈 Import

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ‼️ CẢNH BÁO: API NÀY LÀ MỘT LỖ HỔNG BẢO MẬT
   * (Nó cho phép bất kỳ ai tạo User)
   * API này chỉ nên được gọi bởi Admin, hoặc bị XÓA BỎ
   * (Vì logic đăng ký sẽ nằm trong AuthController)
   *
   * Tạm thời giữ lại để TEST.
   */
  @Post()
  create(@Body() dto: CreateUserDto) {
    // 👈 (Tạm thời hard-code role là candidate)
    return this.usersService.create(dto, UserRole.CANDIDATE);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}