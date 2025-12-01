// src/modules/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Candidate, Employer } from '../../database/entities';
import { UserRole, UserStatus, EmployerStatus } from '../../common/enums';
import { UserResponseDto, UpdatePasswordDto } from './dto';

/**
 * Users Service
 * Handles user management
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
  ) {}

  /**
   * Get current user info (GET /users/me)
   */
  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['candidate', 'employer'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.mapToUserResponse(user);
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['candidate', 'employer'],
    });
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Update password
   */
  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Update user status (for admin or internal use)
   */
  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['candidate', 'employer'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.status = status;
    await this.userRepository.save(user);

    return this.mapToUserResponse(user);
  }

  /**
   * Get user profile completion status
   */
  async getProfileCompletionStatus(userId: string): Promise<{
    isComplete: boolean;
    missingFields: string[];
    nextStep: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'candidate',
        'candidate.cvs',
        'employer',
        'employer.locations',
      ],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const missingFields: string[] = [];
    let nextStep = '';

    if (user.role === UserRole.CANDIDATE && user.candidate) {
      const candidate = user.candidate;

      if (!candidate.phoneNumber) missingFields.push('phoneNumber');
      if (!candidate.addressCity) missingFields.push('addressCity');
      if (!candidate.experienceLevel) missingFields.push('experienceLevel');
      if (!candidate.cvs || candidate.cvs.length === 0)
        missingFields.push('cv');

      if (missingFields.length > 0) {
        nextStep = 'Hoàn thiện thông tin cá nhân và tải lên CV';
      }
    } else if (user.role === UserRole.EMPLOYER && user.employer) {
      const employer = user.employer;

      if (!employer.description) missingFields.push('description');
      if (!employer.logoUrl) missingFields.push('logoUrl');
      if (!employer.locations || employer.locations.length === 0)
        missingFields.push('location');
      if (!employer.contactPhone) missingFields.push('contactPhone');

      if (missingFields.length > 0) {
        nextStep = 'Hoàn thiện thông tin công ty và thêm địa điểm văn phòng';
      } else if (employer.status === EmployerStatus.PENDING_APPROVAL) {
        nextStep = 'Chờ admin duyệt hồ sơ';
      }
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      nextStep,
    };
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Verify email (mark user as verified)
   */
  async verifyEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.isVerified = true;
    user.emailVerifiedAt = new Date();

    // Update status based on role
    if (user.role === UserRole.CANDIDATE) {
      user.status = UserStatus.ACTIVE;
    } else if (user.role === UserRole.EMPLOYER) {
      user.status = UserStatus.PENDING_PROFILE_COMPLETION;
    }

    await this.userRepository.save(user);
  }

  /**
   * Map User entity to response DTO
   */
  private mapToUserResponse(user: User): UserResponseDto {
    const response: UserResponseDto = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Add profile info based on role
    if (user.role === UserRole.CANDIDATE && user.candidate) {
      response.profileId = user.candidate.id;
      response.fullName = user.candidate.fullName;
      response.hasCompleteProfile = !!(
        user.candidate.phoneNumber && user.candidate.addressCity
      );
    } else if (user.role === UserRole.EMPLOYER && user.employer) {
      response.profileId = user.employer.id;
      response.fullName = user.employer.fullName;
      response.hasCompleteProfile = user.employer.hasCompleteProfile();
    }

    return response;
  }
}
