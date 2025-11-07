import { Controller, Post, Body, HttpCode,HttpStatus, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/candidate')
  @HttpCode(HttpStatus.CREATED)
  registerCandidate(@Body() dto: RegisterCandidateDto) {
    return this.authService.registerCandidate(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Public()
  @Post('register/employer')
  @HttpCode(HttpStatus.CREATED)
  registerEmployer(@Body() dto: RegisterEmployerDto) {
    return this.authService.registerEmployer(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
