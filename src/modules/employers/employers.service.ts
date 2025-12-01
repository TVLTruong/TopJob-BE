// src/modules/employers/employers.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employer, EmployerLocation, User } from '../../database/entities';
import { UserStatus } from '../../common/enums';
import {
  UpdateEmployerProfileDto,
  EmployerProfileResponseDto,
  AddLocationDto,
  EmployerLocationResponseDto,
} from './dto';

/**
 * Employers Service
 * Handles employer profile management
 * UC-EMP-01: Hoàn thiện hồ sơ nhà tuyển dụng
 * UC-EMP-02: Cập nhật thông tin công ty
 */
@Injectable()
export class EmployersService {
  constructor(
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    @InjectRepository(EmployerLocation)
    private readonly locationRepository: Repository<EmployerLocation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get employer profile by user ID
   */
  async getProfileByUserId(
    userId: string,
  ): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
      relations: ['user', 'locations'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    return this.mapToProfileResponse(employer);
  }

  /**
   * Get employer profile by employer ID
   */
  async getProfileById(id: string): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { id },
      relations: ['user', 'locations'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    return this.mapToProfileResponse(employer);
  }

  /**
   * Update employer profile (Next Step after registration)
   * UC-EMP-01: Hoàn thiện hồ sơ nhà tuyển dụng
   */
  async updateProfile(
    userId: string,
    dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
      relations: ['user', 'locations'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    // Use transaction for updating employer and locations
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update employer fields
      Object.assign(employer, {
        fullName: dto.fullName ?? employer.fullName,
        workTitle: dto.workTitle ?? employer.workTitle,
        companyName: dto.companyName ?? employer.companyName,
        description: dto.description ?? employer.description,
        website: dto.website ?? employer.website,
        logoUrl: dto.logoUrl ?? employer.logoUrl,
        coverImageUrl: dto.coverImageUrl ?? employer.coverImageUrl,
        foundedYear: dto.foundedYear ?? employer.foundedYear,
        companySize: dto.companySize ?? employer.companySize,
        contactEmail: dto.contactEmail ?? employer.contactEmail,
        contactPhone: dto.contactPhone ?? employer.contactPhone,
        linkedlnUrl: dto.linkedlnUrl ?? employer.linkedlnUrl,
        facebookUrl: dto.facebookUrl ?? employer.facebookUrl,
        xUrl: dto.xUrl ?? employer.xUrl,
        benefits: dto.benefits ?? employer.benefits,
      });

      await queryRunner.manager.save(employer);

      // Handle locations if provided
      if (dto.locations && dto.locations.length > 0) {
        for (const locDto of dto.locations) {
          if (locDto.id) {
            // Update existing location
            const existingLoc = await this.locationRepository.findOne({
              where: { id: locDto.id, employerId: employer.id },
            });

            if (existingLoc) {
              Object.assign(existingLoc, {
                isHeadquarters:
                  locDto.isHeadquarters ?? existingLoc.isHeadquarters,
                province: locDto.province ?? existingLoc.province,
                district: locDto.district ?? existingLoc.district,
                detailedAddress:
                  locDto.detailedAddress ?? existingLoc.detailedAddress,
              });

              // If setting as headquarters, unset others
              if (locDto.isHeadquarters) {
                await queryRunner.manager.update(
                  EmployerLocation,
                  { employerId: employer.id, isHeadquarters: true },
                  { isHeadquarters: false },
                );
              }

              await queryRunner.manager.save(existingLoc);
            }
          } else {
            // Create new location
            if (locDto.province && locDto.district && locDto.detailedAddress) {
              const newLoc = this.locationRepository.create({
                employerId: employer.id,
                isHeadquarters: locDto.isHeadquarters ?? false,
                province: locDto.province,
                district: locDto.district,
                detailedAddress: locDto.detailedAddress,
              });

              // If setting as headquarters, unset others
              if (newLoc.isHeadquarters) {
                await queryRunner.manager.update(
                  EmployerLocation,
                  { employerId: employer.id, isHeadquarters: true },
                  { isHeadquarters: false },
                );
              }

              await queryRunner.manager.save(newLoc);
            }
          }
        }
      }

      // Update user status if profile is complete
      const user = employer.user;
      if (user && user.status === UserStatus.PENDING_PROFILE_COMPLETION) {
        // Reload employer with locations to check completeness
        const reloadedEmployer = await queryRunner.manager.findOne(Employer, {
          where: { id: employer.id },
          relations: ['locations'],
        });

        if (reloadedEmployer && this.isProfileComplete(reloadedEmployer)) {
          user.status = UserStatus.PENDING_APPROVAL;
          await queryRunner.manager.save(user);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.getProfileByUserId(userId);
  }

  /**
   * Add new location
   */
  async addLocation(
    userId: string,
    dto: AddLocationDto,
  ): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
      relations: ['locations'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    // Check max locations limit
    if (employer.locations && employer.locations.length >= 10) {
      throw new BadRequestException(
        'Bạn đã đạt giới hạn số lượng địa điểm (tối đa 10)',
      );
    }

    const location = this.locationRepository.create({
      employerId: employer.id,
      isHeadquarters: dto.isHeadquarters ?? false,
      province: dto.province,
      district: dto.district,
      detailedAddress: dto.detailedAddress,
    });

    // If setting as headquarters, unset others
    if (location.isHeadquarters && employer.locations) {
      await this.locationRepository.update(
        { employerId: employer.id, isHeadquarters: true },
        { isHeadquarters: false },
      );
    }

    // If this is the first location, set as headquarters
    if (!employer.locations || employer.locations.length === 0) {
      location.isHeadquarters = true;
    }

    await this.locationRepository.save(location);

    return this.getProfileByUserId(userId);
  }

  /**
   * Delete location
   */
  async deleteLocation(
    userId: string,
    locationId: string,
  ): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
      relations: ['locations'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const location = employer.locations?.find((l) => l.id === locationId);
    if (!location) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    const wasHeadquarters = location.isHeadquarters;
    await this.locationRepository.remove(location);

    // If deleted location was headquarters, set another as headquarters
    if (wasHeadquarters) {
      const remainingLocations = await this.locationRepository.find({
        where: { employerId: employer.id },
        order: { createdAt: 'ASC' },
      });

      if (remainingLocations.length > 0) {
        remainingLocations[0].isHeadquarters = true;
        await this.locationRepository.save(remainingLocations[0]);
      }
    }

    return this.getProfileByUserId(userId);
  }

  /**
   * Set headquarters
   */
  async setHeadquarters(
    userId: string,
    locationId: string,
  ): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
      relations: ['locations'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const location = employer.locations?.find((l) => l.id === locationId);
    if (!location) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    // Unset all headquarters for this employer
    await this.locationRepository.update(
      { employerId: employer.id },
      { isHeadquarters: false },
    );

    // Set new headquarters
    location.isHeadquarters = true;
    await this.locationRepository.save(location);

    return this.getProfileByUserId(userId);
  }

  /**
   * Get all locations
   */
  async getLocations(userId: string): Promise<EmployerLocationResponseDto[]> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const locations = await this.locationRepository.find({
      where: { employerId: employer.id },
      order: { isHeadquarters: 'DESC', createdAt: 'ASC' },
    });

    return locations.map((loc) => this.mapToLocationResponse(loc));
  }

  /**
   * Check if profile is complete enough for approval
   */
  private isProfileComplete(employer: Employer): boolean {
    return !!(
      employer.companyName &&
      employer.description &&
      employer.logoUrl &&
      employer.locations &&
      employer.locations.length > 0
    );
  }

  /**
   * Map Location entity to response DTO
   */
  private mapToLocationResponse(
    location: EmployerLocation,
  ): EmployerLocationResponseDto {
    return {
      id: location.id,
      isHeadquarters: location.isHeadquarters,
      province: location.province,
      district: location.district,
      detailedAddress: location.detailedAddress,
      fullAddress: location.getFullAddress(),
    };
  }

  /**
   * Map Employer entity to response DTO
   */
  private mapToProfileResponse(employer: Employer): EmployerProfileResponseDto {
    return {
      id: employer.id,
      userId: employer.userId,
      fullName: employer.fullName,
      workTitle: employer.workTitle,
      email: employer.user?.email,
      companyName: employer.companyName,
      description: employer.description,
      website: employer.website,
      logoUrl: employer.logoUrl,
      coverImageUrl: employer.coverImageUrl,
      foundedYear: employer.foundedYear,
      companySize: employer.companySize,
      contactEmail: employer.contactEmail,
      contactPhone: employer.contactPhone,
      linkedlnUrl: employer.linkedlnUrl,
      facebookUrl: employer.facebookUrl,
      xUrl: employer.xUrl,
      isApproved: employer.isApproved,
      status: employer.status,
      profileStatus: employer.profileStatus,
      benefits: employer.benefits,
      locations: employer.locations?.map((loc) =>
        this.mapToLocationResponse(loc),
      ),
      companyAge: employer.getCompanyAge(),
      headquarters: employer.getHeadquarters()
        ? this.mapToLocationResponse(employer.getHeadquarters()!)
        : undefined,
      hasCompleteProfile: employer.hasCompleteProfile(),
      createdAt: employer.createdAt,
      updatedAt: employer.updatedAt,
    };
  }
}
