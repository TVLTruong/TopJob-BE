import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator'; // 👈 (Quan trọng nếu bạn set Guard toàn cục)

@Controller('auth') // Route gốc: /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * API ĐĂNG KÝ
   * POST /api/auth/register
   */
  @Public() // 👈 Đánh dấu API này là công khai
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * API ĐĂNG NHẬP
   * POST /api/auth/login
   */
  @Public() // 👈 Đánh dấu API này là công khai
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}