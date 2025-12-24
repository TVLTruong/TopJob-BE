// src/modules/auth/services/employer-email.service.ts

import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

/**
 * Employer Email Service
 * Handles sending emails for employer-related notifications
 */
@Injectable()
export class EmployerEmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send employer approval notification email
   */
  async sendEmployerApprovalEmail(
    email: string,
    companyName: string,
    isNewProfile: boolean,
  ): Promise<void> {
    const appName = this.configService.get<string>('app.name', 'TopJob');
    const subject = isNewProfile
      ? `[${appName}] Hồ sơ nhà tuyển dụng của bạn đã được duyệt`
      : `[${appName}] Chỉnh sửa hồ sơ của bạn đã được duyệt`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; color: #2563eb; margin-bottom: 20px; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 8px; }
              .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Thông báo duyệt hồ sơ</h1>
              </div>
              <div class="content">
                <p>Kính gửi <strong>${companyName}</strong>,</p>
                
                <div class="success-box">
                  <strong>🎉 Chúc mừng!</strong><br>
                  ${isNewProfile ? 'Hồ sơ nhà tuyển dụng của bạn đã được quản trị viên duyệt thành công!' : 'Các chỉnh sửa hồ sơ của bạn đã được quản trị viên duyệt thành công!'}
                </div>
                
                <p>Bây giờ bạn có thể:</p>
                <ul>
                  <li>Đăng tin tuyển dụng</li>
                  <li>Quản lý các bài đăng tuyển dụng</li>
                  <li>Xem và quản lý hồ sơ ứng tuyển</li>
                  <li>Cập nhật thông tin công ty</li>
                </ul>
                
                <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của ${appName}!</p>
                
                <p>Trân trọng,<br><strong>Đội ngũ ${appName}</strong></p>
                
                <div class="footer">
                  <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                  <p>&copy; ${new Date().getFullYear()} ${appName}. Bảo lưu mọi quyền.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (error) {
      // Log error but don't fail the approval process
      console.error('Failed to send employer approval email:', error);
    }
  }

  /**
   * Send employer rejection notification email
   */
  async sendEmployerRejectionEmail(
    email: string,
    companyName: string,
    reason: string,
    isNewProfile: boolean,
  ): Promise<void> {
    const appName = this.configService.get<string>('app.name', 'TopJob');
    const subject = isNewProfile
      ? `[${appName}] Hồ sơ nhà tuyển dụng của bạn cần được xem xét lại`
      : `[${appName}] Chỉnh sửa hồ sơ của bạn cần được xem xét lại`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; color: #dc2626; margin-bottom: 20px; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 8px; }
              .warning-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Thông báo về hồ sơ</h1>
              </div>
              <div class="content">
                <p>Kính gửi <strong>${companyName}</strong>,</p>
                
                <div class="warning-box">
                  <strong>Hồ sơ cần xem xét lại</strong><br>
                  ${isNewProfile ? 'Hồ sơ nhà tuyển dụng của bạn chưa được duyệt.' : 'Các chỉnh sửa hồ sơ của bạn chưa được duyệt.'}
                </div>
                
                <p><strong>Lý do:</strong></p>
                <p style="padding: 10px; background-color: #fff; border-radius: 4px;">${reason}</p>
                
                <p>Vui lòng:</p>
                <ul>
                  <li>Xem lại nội dung hồ sơ của bạn</li>
                  <li>Chỉnh sửa theo yêu cầu</li>
                  <li>Gửi lại hồ sơ để được xem xét</li>
                </ul>
                
                <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
                
                <p>Trân trọng,<br><strong>Đội ngũ ${appName}</strong></p>
                
                <div class="footer">
                  <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                  <p>&copy; ${new Date().getFullYear()} ${appName}. Bảo lưu mọi quyền.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (error) {
      // Log error but don't fail the rejection process
      console.error('Failed to send employer rejection email:', error);
    }
  }
}
