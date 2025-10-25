import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Đăng ký User Entity
  ],
  providers: [UserService],
  exports: [UserService], // Xuất UserService để AuthModule có thể dùng
})
export class UserModule {}
