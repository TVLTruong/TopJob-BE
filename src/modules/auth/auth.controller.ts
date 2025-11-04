import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // Route gốc: /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * API ĐĂNG KÝ
   * POST /api/auth/register
   */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * API ĐĂNG NHẬP
   * POST /api/auth/login
   */
  @HttpCode(HttpStatus.OK) // Đổi status code từ 201 (Created) -> 200 (OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}