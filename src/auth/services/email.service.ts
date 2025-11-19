// src/auth/services/email.service.ts

import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose, OtpPurposeLabel } from '../../common/enums';

/**
 * Email Service
 * Handles sending emails for various purposes
 */
@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send OTP verification email
   * @param email - Recipient email
   * @param otpCode - 6-digit OTP code
   * @param purpose - Purpose of OTP
   * @param expiresInMinutes - OTP expiry time in minutes
   */
  async sendOtpEmail(
    email: string,
    otpCode: string,
    purpose: OtpPurpose,
    expiresInMinutes: number,
  ): Promise<void> {
    const mailUser = this.configService.get<string>('mail.user');
    const mailPass = this.configService.get<string>('mail.password');
    if (!mailUser || !mailPass) {
      throw new Error(
        'Mail service chưa cấu hình đầy đủ (MAIL_USER / MAIL_PASS).',
      );
    }

    const appName = this.configService.get<string>('app.name', 'TopJob');
    const purposeLabel = OtpPurposeLabel[purpose];
    const subject = `[${appName}] Mã xác thực ${purposeLabel}`;
    const html = this.generateOtpEmailTemplate(
      otpCode,
      purposeLabel,
      expiresInMinutes,
      appName,
    );

    try {
      await this.mailerService.sendMail({ to: email, subject, html });
    } catch (err) {
      // Wrap lỗi gốc
      throw new Error(
        `Gửi email thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
      );
    }
  }

  /**
   * Generate OTP email template
   */
  private generateOtpEmailTemplate(
    otpCode: string,
    purpose: string,
    expiresInMinutes: number,
    appName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
          }
          .otp-box {
            background-color: #fff;
            border: 2px dashed #2563eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .expiry {
            color: #dc2626;
            font-weight: bold;
            margin-top: 10px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 10px 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Mã xác thực ${purpose}</p>
          </div>
          
          <p>Xin chào,</p>
          
          <p>Bạn đã yêu cầu <strong>${purpose.toLowerCase()}</strong> trên hệ thống ${appName}. 
          Vui lòng sử dụng mã xác thực bên dưới để hoàn tất:</p>
          
          <div class="otp-box">
            <div>Mã xác thực của bạn:</div>
            <div class="otp-code">${otpCode}</div>
            <div class="expiry">Có hiệu lực trong ${expiresInMinutes} phút</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Lưu ý bảo mật:</strong>
            <ul style="margin: 5px 0;">
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>Mã chỉ sử dụng được một lần</li>
              <li>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email</li>
            </ul>
          </div>
          
          <p>Trân trọng,<br><strong>Đội ngũ ${appName}</strong></p>
          
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const appName = this.configService.get<string>('app.name', 'TopJob');

    await this.mailerService.sendMail({
      to: email,
      subject: `[${appName}] Chào mừng bạn đến với ${appName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; color: #2563eb; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng đến với ${appName}!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Email của bạn đã được xác thực thành công!</p>
              <p>Bây giờ bạn có thể:</p>
              <ul>
                <li>Tìm kiếm và ứng tuyển các công việc phù hợp</li>
                <li>Tạo và quản lý hồ sơ cá nhân</li>
                <li>Lưu các công việc yêu thích</li>
                <li>Theo dõi trạng thái ứng tuyển</li>
              </ul>
              <p>Chúc bạn tìm được công việc mơ ước!</p>
              <p>Trân trọng,<br><strong>Đội ngũ ${appName}</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
