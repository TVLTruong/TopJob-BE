import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/candidate')
  @HttpCode(201)
  registerCandidate(@Body() dto: RegisterCandidateDto) {
    return this.authService.registerCandidate(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }
}
