import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/modules/storage/storage.service';
import * as fs from 'fs';
import * as path from 'path';

interface LogoUploadResult {
  fileName: string;
  url: string;
  publicId: string;
}

async function uploadLogos() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const storageService = app.get(StorageService);

  // Đường dẫn folder chứa logos
  const logoFolder = 'T:\\UIT\\S7\\WEB\\Project\\Data\\downloaded_logos';

  // Kiểm tra folder có tồn tại không
  if (!fs.existsSync(logoFolder)) {
    console.error(`❌ Folder không tồn tại: ${logoFolder}`);
    process.exit(1);
  }

  // Đọc tất cả files trong folder
  const files = fs.readdirSync(logoFolder);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  console.log(`📁 Tìm thấy ${imageFiles.length} ảnh logo trong folder`);
  console.log('🚀 Bắt đầu upload...\n');

  const results: LogoUploadResult[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const fileName = imageFiles[i];
    const filePath = path.join(logoFolder, fileName);

    try {
      console.log(`[${i + 1}/${imageFiles.length}] Đang upload: ${fileName}`);

      // Đọc file thành buffer
      const fileBuffer = fs.readFileSync(filePath);

      // Lấy mimetype từ extension
      const ext = path.extname(fileName).toLowerCase();
      const mimetypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      };
      const mimetype = mimetypeMap[ext] || 'image/jpeg';

      // Tạo object giống Express.Multer.File
      const multerFile = {
        fieldname: 'file',
        originalname: fileName,
        encoding: '7bit',
        mimetype: mimetype,
        buffer: fileBuffer,
        size: fileBuffer.length,
      } as Express.Multer.File;

      // Upload lên Cloudinary qua StorageService
      const result = await storageService.uploadCompanyLogo(multerFile);

      results.push({
        fileName,
        url: result.url,
        publicId: result.publicId,
      });

      console.log(`   ✅ Thành công: ${result.url}\n`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Lỗi: ${errorMessage}\n`);
      errors.push({ fileName, error: errorMessage });
    }
  }

  // In kết quả
  console.log('\n' + '='.repeat(80));
  console.log('📊 KẾT QUẢ UPLOAD');
  console.log('='.repeat(80));
  console.log(`✅ Thành công: ${results.length}/${imageFiles.length}`);
  console.log(`❌ Thất bại: ${errors.length}/${imageFiles.length}\n`);

  if (results.length > 0) {
    console.log('📝 DANH SÁCH URL ĐÃ UPLOAD:');
    console.log('='.repeat(80));
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.fileName}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Public ID: ${result.publicId}\n`);
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ DANH SÁCH LỖI:');
    console.log('='.repeat(80));
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.fileName}: ${error.error}`);
    });
  }

  // Xuất ra file JSON để dễ copy-paste cho seed data
  const outputPath = path.join(__dirname, 'uploaded-logos.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        totalUploaded: results.length,
        totalFailed: errors.length,
        uploadDate: new Date().toISOString(),
        results: results.map((r) => ({
          fileName: r.fileName,
          url: r.url,
        })),
        errors,
      },
      null,
      2,
    ),
  );

  console.log(`\n💾 Kết quả đã được lưu vào: ${outputPath}`);
  console.log('\n📋 COPY ARRAY URLs CHO SEED DATA:');
  console.log('='.repeat(80));
  console.log('const logoUrls = [');
  results.forEach((r) => {
    console.log(`  '${r.url}', // ${r.fileName}`);
  });
  console.log('];');

  await app.close();
}

uploadLogos()
  .then(() => {
    console.log('\n✅ Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  });
