// Test Email Configuration
const nodemailer = require('nodemailer');

async function testEmail() {
  // Đọc từ .env hoặc thay bằng email thực của bạn
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER || 'YOUR_EMAIL@gmail.com', // Thay bằng email của bạn
      pass: process.env.MAIL_PASSWORD || 'YOUR_APP_PASSWORD', // Thay bằng App Password
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@topjob.com',
      to: process.env.MAIL_USER || 'YOUR_EMAIL@gmail.com', // Gửi đến chính email của bạn
      subject: 'Test Email from TopJob',
      html: '<h1>Email service hoạt động!</h1><p>Nếu bạn nhận được email này, cấu hình SMTP đã đúng.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
