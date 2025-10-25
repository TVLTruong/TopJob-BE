import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // <-- IMPORT DTO MỚI

@Controller('auth') // Đường dẫn gốc: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * API Đăng ký: POST /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Trả về mã 201 khi thành công
  async register(@Body() registerDto: RegisterDto) {
    // Dùng DTO mới (đã xóa 'role')
    return this.authService.register(registerDto);
  }

  /**
   * API Đăng nhập: POST /auth/login
   */
  @Post('login') // <-- ENDPOINT MỚI
  @HttpCode(HttpStatus.OK) // Trả về mã 200
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
