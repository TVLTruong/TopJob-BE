import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // 👈 Dùng để đọc .env
import type { RequestUser } from '../../../common/interfaces/request-user.interface';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../../common/enums/user-status.enum'; // 👈 Import Enum
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService, // 👈 Để check user
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      // --- 🚀 ĐÂY LÀ CHỖ SỬA LỖI 1 ---
      // Dùng 'getOrThrow' để đảm bảo 'secretOrKey' luôn là 'string'
      // và đọc đúng biến 'JWT_SECRET' từ file .env
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      // -----------------------------
    });
  }

  /**
   * Hàm này được Passport tự động gọi sau khi giải mã token thành công
   * (Nó sẽ "nhét" kết quả trả về vào req.user)
   */
  async validate(payload: RequestUser): Promise<RequestUser> {
    // 1. Token hợp lệ, nhưng kiểm tra xem user (từ Bảng 1) có bị ban không?
    const user = await this.usersService.findOne(payload.sub); // Tìm user bằng ID

    // Nếu không tìm thấy user (ví dụ: user bị xóa)
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    // Nếu user không active
    if (user.status !== UserStatus.PENDING && !user.employer?.isApproved) {
      throw new UnauthorizedException('Hồ sơ của bạn chưa được phê duyệt');
    }

    // Nếu user bị ban (admin khóa tài khoản)
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // 2. Token OK, User OK. Gắn 'payload' vào req.user
    // 'payload' chính là { sub, email, role }
    return payload;
  }
}
