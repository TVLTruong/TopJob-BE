// src/modules/employers/employers.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not } from 'typeorm';
import {
  Employer,
  EmployerLocation,
  EmployerPendingEdit,
  User,
  Application,
  Job,
  // Candidate,
  // CandidateCv,
} from '../../database/entities';
import {
  UserStatus,
  EmployerStatus,
  EmployerProfileStatus,
  ApplicationStatus,
} from '../../common/enums';
import {
  UpdateEmployerProfileDto,
  EmployerProfileResponseDto,
  AddLocationDto,
  EmployerLocationResponseDto,
  ApplicationDetailResponseDto,
  UpdateApplicationStatusResponseDto,
  ApplicationAction,
  GetApplicationsQueryDto,
  ApplicationListItemDto,
} from './dto';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { createPaginationResponse } from '../../common/utils/query-builder.util';

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
    @InjectRepository(EmployerPendingEdit)
    private readonly pendingEditRepository: Repository<EmployerPendingEdit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
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
   * Update employer profile and save changes to pending_edit table
   * Changes will only be applied after admin approval
   * Used by PUT /employers/me (ownership by user.id from JWT)
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
      const manager = queryRunner.manager;

      // Helper function to convert value to string or null
      const valueToString = (value: any): string | null => {
        if (value === null || value === undefined) return null;
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };

      // Helper to check if two values are equal
      const valuesEqual = (oldVal: any, newVal: any): boolean => {
        if (oldVal === newVal) return true;
        if (oldVal == null || newVal == null) return oldVal === newVal;

        // Special handling for Date objects
        if (oldVal instanceof Date && newVal instanceof Date) {
          return oldVal.getTime() === newVal.getTime();
        }

        // For other types, use strict equality
        return oldVal === newVal;
      };

      // Prepare pending edits array
      const pendingEdits: Array<{
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
      }> = [];

      // Track all field changes
      const fieldMappings: Array<{
        dtoKey: keyof UpdateEmployerProfileDto;
        fieldName: string;
        currentValue: any;
      }> = [
        {
          dtoKey: 'fullName',
          fieldName: 'fullName',
          currentValue: employer.fullName,
        },
        {
          dtoKey: 'workTitle',
          fieldName: 'workTitle',
          currentValue: employer.workTitle,
        },
        {
          dtoKey: 'companyName',
          fieldName: 'companyName',
          currentValue: employer.companyName,
        },
        {
          dtoKey: 'description',
          fieldName: 'description',
          currentValue: employer.description,
        },
        {
          dtoKey: 'website',
          fieldName: 'website',
          currentValue: employer.website,
        },
        {
          dtoKey: 'logoUrl',
          fieldName: 'logoUrl',
          currentValue: employer.logoUrl,
        },
        {
          dtoKey: 'foundedDate',
          fieldName: 'foundedDate',
          currentValue: employer.foundedDate,
        },
        {
          dtoKey: 'contactEmail',
          fieldName: 'contactEmail',
          currentValue: employer.contactEmail,
        },
        {
          dtoKey: 'contactPhone',
          fieldName: 'contactPhone',
          currentValue: employer.contactPhone,
        },
        {
          dtoKey: 'linkedlnUrl',
          fieldName: 'linkedlnUrl',
          currentValue: employer.linkedlnUrl,
        },
        {
          dtoKey: 'facebookUrl',
          fieldName: 'facebookUrl',
          currentValue: employer.facebookUrl,
        },
        { dtoKey: 'xUrl', fieldName: 'xUrl', currentValue: employer.xUrl },
      ];

      // Check simple fields
      for (const { dtoKey, fieldName, currentValue } of fieldMappings) {
        const newValue = dto[dtoKey];
        if (newValue !== undefined && !valuesEqual(currentValue, newValue)) {
          pendingEdits.push({
            fieldName,
            // oldValue: currentValue ? String(currentValue) : null,
            // newValue: newValue ? String(newValue) : null,
            oldValue: valueToString(currentValue),
            newValue: valueToString(newValue),
          });
        }
      }

      // Check array fields (employerCategory, benefits, technologies)
      if (dto.employerCategory !== undefined) {
        const oldValue = JSON.stringify(employer.employerCategory || []);
        const newValue = JSON.stringify(dto.employerCategory);
        if (oldValue !== newValue) {
          pendingEdits.push({
            fieldName: 'employerCategory',
            oldValue,
            newValue,
          });
        }
      }

      if (dto.benefits !== undefined) {
        const oldValue = JSON.stringify(employer.benefits || []);
        const newValue = JSON.stringify(dto.benefits);
        if (oldValue !== newValue) {
          pendingEdits.push({
            fieldName: 'benefits',
            oldValue,
            newValue,
          });
        }
      }

      if (dto.technologies !== undefined) {
        const oldValue = JSON.stringify(employer.technologies || []);
        const newValue = JSON.stringify(dto.technologies);
        if (oldValue !== newValue) {
          pendingEdits.push({
            fieldName: 'technologies',
            oldValue,
            newValue,
          });
        }
      }

      // Check locations changes
      if (dto.locations !== undefined) {
        const oldValue = JSON.stringify(employer.locations || []);
        const newValue = JSON.stringify(dto.locations);
        if (oldValue !== newValue) {
          pendingEdits.push({
            fieldName: 'locations',
            oldValue,
            newValue,
          });
        }
      }

      // Only proceed if there are actual changes
      if (pendingEdits.length === 0) {
        await queryRunner.commitTransaction();
        return this.getProfileByUserId(userId);
      }

      // Delete existing pending edits for these fields
      const fieldNames = pendingEdits.map((edit) => edit.fieldName);
      await manager.delete(EmployerPendingEdit, {
        employerId: employer.id,
        fieldName: In(fieldNames),
      });

      // Insert new pending edits
      for (const edit of pendingEdits) {
        const pendingEdit = manager.create(EmployerPendingEdit, {
          employerId: employer.id,
          fieldName: edit.fieldName,
          oldValue: edit.oldValue,
          newValue: edit.newValue,
        });
        await manager.save(pendingEdit);
      }

      // Update profile status to pending approval
      employer.profileStatus = EmployerProfileStatus.PENDING_EDIT_APPROVAL;
      await manager.save(employer);

      // Update user status if profile is complete (for first-time profile completion)
      const user = employer.user;
      if (user && user.status === UserStatus.PENDING_PROFILE_COMPLETION) {
        // For first-time completion, we still need to check if profile has minimum required fields
        if (this.isProfileComplete(employer)) {
          user.status = UserStatus.ACTIVE;
          await manager.save(user);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Return current unchanged profile (not the pending changes)
    return this.getProfileByUserId(userId);
  }

  /**
   * Update employer profile with auto-approve and full locations CRUD
   * Used by PUT /employer/profile (ownership by userId)
   */
  async updateProfileAutoApprove(
    userId: string,
    dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const employer = await manager.findOne(Employer, {
        where: { userId },
        relations: ['user', 'locations'],
      });

      if (!employer) {
        throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
      }

      Object.assign(employer, {
        fullName: dto.fullName ?? employer.fullName,
        workTitle: dto.workTitle ?? employer.workTitle,
        companyName: dto.companyName ?? employer.companyName,
        description: dto.description ?? employer.description,
        website: dto.website ?? employer.website,
        logoUrl: dto.logoUrl ?? employer.logoUrl,
        foundedDate: dto.foundedDate ?? employer.foundedDate,
        employerCategory: dto.employerCategory ?? employer.employerCategory,
        contactEmail: dto.contactEmail ?? employer.contactEmail,
        contactPhone: dto.contactPhone ?? employer.contactPhone,
        linkedlnUrl: dto.linkedlnUrl ?? employer.linkedlnUrl,
        facebookUrl: dto.facebookUrl ?? employer.facebookUrl,
        xUrl: dto.xUrl ?? employer.xUrl,
        benefits: dto.benefits ?? employer.benefits,
        technologies: dto.technologies ?? employer.technologies,
      });

      // AUTO-APPROVE LOGIC
      if (!employer.isApproved) {
        employer.isApproved = true;
        employer.status = EmployerStatus.ACTIVE;
        employer.profileStatus = EmployerProfileStatus.APPROVED;
      }

      await manager.save(employer);

      const incoming = dto.locations ?? [];
      const existing = employer.locations ?? [];

      const incomingIds = new Set(
        incoming.filter((l) => l.id).map((l) => l.id as string),
      );

      // DELETE (chỉ khi client gửi ID)
      if (incomingIds.size > 0) {
        const toDelete = existing.filter(
          (loc) => loc.id && !incomingIds.has(loc.id),
        );
        if (toDelete.length) {
          await manager.remove(toDelete);
        }
      }

      let headquartersId: string | null = null;

      // UPDATE / CREATE
      for (const loc of incoming) {
        if (loc.id) {
          const entity = existing.find((e) => e.id === loc.id);
          if (!entity) continue;

          Object.assign(entity, {
            province: loc.province ?? entity.province,
            district: loc.district ?? entity.district,
            detailedAddress: loc.detailedAddress ?? entity.detailedAddress,
            isHeadquarters: loc.isHeadquarters ?? entity.isHeadquarters,
          });

          await manager.save(entity);

          if (entity.isHeadquarters) {
            headquartersId = entity.id;
          }
        } else if (loc.province && loc.district && loc.detailedAddress) {
          const created = manager.create(EmployerLocation, {
            employerId: employer.id,
            province: loc.province,
            district: loc.district,
            detailedAddress: loc.detailedAddress,
            isHeadquarters: loc.isHeadquarters ?? false,
          });

          await manager.save(created);

          if (created.isHeadquarters) {
            headquartersId = created.id;
          }
        }
      }

      // ENSURE SINGLE HEADQUARTERS
      if (headquartersId) {
        await manager.update(
          EmployerLocation,
          {
            employerId: employer.id,
            id: Not(headquartersId),
          },
          { isHeadquarters: false },
        );
      } else {
        const first = await manager.findOne(EmployerLocation, {
          where: { employerId: employer.id },
          order: { createdAt: 'ASC' },
        });
        if (first) {
          first.isHeadquarters = true;
          await manager.save(first);
        }
      }
      // Ensure user is ACTIVE
      if (employer.user && employer.user.status !== UserStatus.ACTIVE) {
        employer.user.status = UserStatus.ACTIVE;
        await manager.save(employer.user);
      }

      await queryRunner.commitTransaction();
      return this.getProfileByUserId(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create pending edits for sensitive fields (no public change)
   * - Save EmployerPendingEdit rows
   * - Set profileStatus = PENDING_EDIT_APPROVAL
   * - Ownership enforced by userId
   */
  async submitSensitiveEdit(
    userId: string,
    dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    const employer = await this.employerRepository.findOne({
      where: { userId },
      relations: ['pendingEdits'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    type SensitiveField = 'companyName' | 'logoUrl';
    type SensitiveFieldValue = string | null;

    const sensitiveFields: SensitiveField[] = ['companyName', 'logoUrl'];

    // Collect pending edits for fields provided and different from current
    const changes: EmployerPendingEdit[] = [];
    for (const field of sensitiveFields) {
      const newValue = dto[field] as SensitiveFieldValue | undefined;
      if (typeof newValue === 'undefined') continue;
      const oldValue =
        field === 'companyName'
          ? (employer.companyName ?? null)
          : (employer.logoUrl ?? null);
      if (newValue === oldValue) continue;

      const pendingEdit = this.pendingEditRepository.create({
        employerId: employer.id,
        fieldName: field as string,
        oldValue: oldValue,
        newValue: newValue,
      });
      changes.push(pendingEdit);
    }

    if (changes.length === 0) {
      throw new BadRequestException('Không có thay đổi nhạy cảm để duyệt');
    }

    // Transaction: clear existing pending for same fields, insert new, update profileStatus
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Remove existing pending edits for the same fields
      await queryRunner.manager.delete(EmployerPendingEdit, {
        employerId: employer.id,
        fieldName: In(changes.map((c) => c.fieldName)),
      });

      // Insert new pending edits
      await queryRunner.manager.save(EmployerPendingEdit, changes);

      // Update profile status to pending edit approval (no public profile change)
      await queryRunner.manager.update(
        Employer,
        { id: employer.id },
        { profileStatus: EmployerProfileStatus.PENDING_EDIT_APPROVAL },
      );

      // TODO: integrate admin notification/event for pending edit approval workflow

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Return current public profile (unchanged)
    return this.getProfileByUserId(userId);
  }

  /**
   * Submit employer profile for approval (only when pending profile completion)
   * - Validate logo and at least 1 location
   * - Transaction: employer + locations + user status update
   */
  async submitProfile(
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

    const user = employer.user;

    if (!user || user.status !== UserStatus.PENDING_PROFILE_COMPLETION) {
      throw new BadRequestException(
        'Chỉ được phép gửi hồ sơ khi trạng thái là chờ hoàn thiện hồ sơ',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update employer fields (reuse existing values if missing)
      Object.assign(employer, {
        fullName: dto.fullName ?? employer.fullName,
        workTitle: dto.workTitle ?? employer.workTitle,
        companyName: dto.companyName ?? employer.companyName,
        description: dto.description ?? employer.description,
        website: dto.website ?? employer.website,
        logoUrl: dto.logoUrl ?? employer.logoUrl,
        // coverImageUrl: dto.coverImageUrl ?? employer.coverImageUrl,
        foundedDate: dto.foundedDate ?? employer.foundedDate,
        employerCategory: dto.employerCategory ?? employer.employerCategory,
        // companySize: dto.companySize ?? employer.companySize,
        contactEmail: dto.contactEmail ?? employer.contactEmail,
        contactPhone: dto.contactPhone ?? employer.contactPhone,
        linkedlnUrl: dto.linkedlnUrl ?? employer.linkedlnUrl,
        facebookUrl: dto.facebookUrl ?? employer.facebookUrl,
        xUrl: dto.xUrl ?? employer.xUrl,
        benefits: dto.benefits ?? employer.benefits,
        technologies: dto.technologies ?? employer.technologies,
      });

      await queryRunner.manager.save(employer);

      // Handle locations from DTO (similar to updateProfile)
      if (dto.locations && dto.locations.length > 0) {
        for (const locDto of dto.locations) {
          if (locDto.id) {
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

              if (locDto.isHeadquarters) {
                await queryRunner.manager.update(
                  EmployerLocation,
                  { employerId: employer.id, isHeadquarters: true },
                  { isHeadquarters: false },
                );
              }

              await queryRunner.manager.save(existingLoc);
            }
          } else if (
            locDto.province &&
            locDto.district &&
            locDto.detailedAddress
          ) {
            const newLoc = this.locationRepository.create({
              employerId: employer.id,
              isHeadquarters: locDto.isHeadquarters ?? false,
              province: locDto.province,
              district: locDto.district,
              detailedAddress: locDto.detailedAddress,
            });

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

      // Reload employer with locations inside transaction for validation
      const reloadedEmployer = await queryRunner.manager.findOne(Employer, {
        where: { id: employer.id },
        relations: ['locations', 'user'],
      });

      if (!reloadedEmployer) {
        throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
      }

      // Validation: logo & at least 1 location
      if (!reloadedEmployer.logoUrl) {
        throw new BadRequestException('Logo công ty là bắt buộc');
      }

      if (
        !reloadedEmployer.locations ||
        reloadedEmployer.locations.length < 1
      ) {
        throw new BadRequestException('Cần ít nhất 1 địa điểm công ty');
      }

      // Update user status to pending approval after submit
      const employerUser = reloadedEmployer.user;
      if (employerUser) {
        employerUser.status = UserStatus.PENDING_APPROVAL;
        await queryRunner.manager.save(employerUser);
      }

      //Update employer profile status, is approved and employer status
      reloadedEmployer.profileStatus =
        EmployerProfileStatus.PENDING_NEW_APPROVAL;
      reloadedEmployer.status = EmployerStatus.PENDING_APPROVAL;
      await queryRunner.manager.save(reloadedEmployer);

      await queryRunner.commitTransaction();

      // Return latest profile with locations
      return this.getProfileByUserId(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
      employer.foundedDate &&
      employer.employerCategory &&
      employer.benefits &&
      employer.technologies &&
      (employer.xUrl ||
        employer.facebookUrl ||
        employer.linkedlnUrl ||
        employer.contactEmail) &&
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
      // coverImageUrl: employer.coverImageUrl,
      foundedDate: employer.foundedDate,
      employerCategory: employer.employerCategory,
      // companySize: employer.companySize,
      contactEmail: employer.contactEmail,
      contactPhone: employer.contactPhone,
      linkedlnUrl: employer.linkedlnUrl,
      facebookUrl: employer.facebookUrl,
      xUrl: employer.xUrl,
      isApproved: employer.isApproved,
      status: employer.status,
      profileStatus: employer.profileStatus,
      benefits: employer.benefits,
      technologies: employer.technologies,
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

  /**
   * Get all applications for employer's jobs
   * UC-EMP-05: Quản lý hồ sơ ứng tuyển
   *
   * Security:
   * - Only fetch applications for jobs owned by this employer
   * - If jobId filter provided, verify it belongs to employer
   * - Ownership verified at query level
   */
  async getAllApplications(
    userId: string,
    query: GetApplicationsQueryDto,
  ): Promise<PaginationResponseDto<ApplicationListItemDto>> {
    // Get employer profile
    const employer = await this.employerRepository.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    // ✅ SECURITY: If jobId filter provided, verify ownership first
    if (query.jobId) {
      const job = await this.jobRepository.findOne({
        where: { id: query.jobId, employerId: employer.id },
      });

      if (!job) {
        throw new BadRequestException(
          'Job không tồn tại hoặc không thuộc về bạn',
        );
      }
    }

    // ✅ Build query with ownership verification at query level
    const qb = this.applicationRepository
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .innerJoin('app.candidate', 'candidate')
      .innerJoin('candidate.user', 'user')
      .leftJoin('app.cv', 'cv')
      // ✅ CRITICAL: Only fetch applications for jobs owned by this employer
      .where('job.employerId = :employerId', { employerId: employer.id })
      .select([
        'app.id',
        'app.status',
        'app.appliedAt',
        'app.statusUpdatedAt',
        'candidate.id',
        'candidate.fullName',
        'candidate.phoneNumber',
        'candidate.avatarUrl',
        'user.email',
        'job.id',
        'job.title',
        'job.slug',
        'cv.id',
        'cv.fileName',
        'cv.fileUrl',
      ]);

    // Apply filters
    if (query.jobId) {
      qb.andWhere('job.id = :jobId', { jobId: query.jobId });
    }

    if (query.status) {
      qb.andWhere('app.status = :status', { status: query.status });
    }

    if (query.fromDate) {
      qb.andWhere('app.appliedAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }

    if (query.toDate) {
      qb.andWhere('app.appliedAt <= :toDate', {
        toDate: new Date(query.toDate),
      });
    }

    // Apply search
    if (query.candidateName) {
      qb.andWhere('candidate.fullName ILIKE :name', {
        name: `%${query.candidateName}%`,
      });
    }

    // Default sorting: newest first
    qb.orderBy('app.appliedAt', 'DESC');

    // Get paginated results
    const paginationResult = await createPaginationResponse(
      qb,
      query.page,
      query.limit,
    );

    // Transform Application entities to ApplicationListItemDto
    const transformedData: ApplicationListItemDto[] = paginationResult.data.map(
      (app) => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        statusUpdatedAt: app.statusUpdatedAt,
        candidate: {
          id: app.candidate.id,
          fullName: app.candidate.fullName,
          email: app.candidate.user?.email || '',
          phoneNumber: app.candidate.phoneNumber,
          avatarUrl: app.candidate.avatarUrl,
        },
        job: {
          id: app.job.id,
          title: app.job.title,
          slug: app.job.slug,
        },
        cv: app.cv
          ? {
              id: app.cv.id,
              fileName: app.cv.fileName,
              fileUrl: app.cv.fileUrl,
            }
          : null,
      }),
    );

    return {
      data: transformedData,
      meta: {
        total: paginationResult.meta.total,
        page: paginationResult.meta.page,
        limit: paginationResult.meta.limit,
        totalPages: paginationResult.meta.totalPages,
      },
    };
  }

  /**
   * Get application detail with ownership verification
   * Side effect: NEW → VIEWED status update
   */
  async getApplicationDetail(
    userId: string,
    applicationId: string,
  ): Promise<ApplicationDetailResponseDto> {
    // Get employer profile
    const employer = await this.employerRepository.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    // Get application with all necessary relations
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job', 'candidate', 'candidate.user', 'cv'],
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }

    // Verify ownership: check if job belongs to this employer
    if (application.job.employerId !== employer.id) {
      throw new NotFoundException(
        'Không tìm thấy đơn ứng tuyển hoặc không có quyền truy cập',
      );
    }

    // Side effect: Update status from NEW to VIEWED
    if (application.status === ApplicationStatus.NEW) {
      application.status = ApplicationStatus.VIEWED;
      application.statusUpdatedAt = new Date();
      await this.applicationRepository.save(application);
    }

    return this.mapToApplicationDetailResponse(application);
  }

  /**
   * Map Application entity to detail response DTO
   */
  private mapToApplicationDetailResponse(
    application: Application,
  ): ApplicationDetailResponseDto {
    return {
      id: application.id,
      status: application.status,
      appliedAt: application.appliedAt,
      statusUpdatedAt: application.statusUpdatedAt,
      candidate: {
        id: application.candidate.id,
        fullName: application.candidate.fullName,
        email: application.candidate.user?.email || '',
        phoneNumber: application.candidate.phoneNumber,
        gender: application.candidate.gender,
        dateOfBirth: application.candidate.dateOfBirth,
        avatarUrl: application.candidate.avatarUrl,
        addressCity: application.candidate.addressCity,
        experienceYears: application.candidate.experienceYears,
        experienceLevel: application.candidate.experienceLevel,
      },
      job: {
        id: application.job.id,
        title: application.job.title,
        slug: application.job.slug,
        employmentType: application.job.employmentType,
        workMode: application.job.workMode,
        salaryMin: application.job.salaryMin,
        salaryMax: application.job.salaryMax,
        isNegotiable: application.job.isNegotiable,
        expiredAt: application.job.expiredAt,
      },
      cv: application.cv
        ? {
            id: application.cv.id,
            fileName: application.cv.fileName,
            fileUrl: application.cv.fileUrl,
            fileSize: application.cv.fileSize,
            uploadedAt: application.cv.uploadedAt,
          }
        : null,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }

  /**
   * Update application status (shortlist or reject)
   * Only allowed for NEW or VIEWED status
   * UC-EMP-05: Quản lý hồ sơ ứng tuyển
   *
   * Security: Ownership verified at query level to prevent data leakage
   */
  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    action: ApplicationAction,
  ): Promise<UpdateApplicationStatusResponseDto> {
    // Get employer profile
    const employer = await this.employerRepository.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    // ✅ SECURITY: Verify ownership at query level
    // Only fetch application if it belongs to a job owned by this employer
    const application = await this.applicationRepository
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .where('app.id = :applicationId', { applicationId })
      .andWhere('job.employerId = :employerId', { employerId: employer.id })
      .getOne();

    if (!application) {
      // Could be: application doesn't exist OR employer doesn't own it
      // We don't leak which case it is for security
      throw new NotFoundException(
        'Không tìm thấy đơn ứng tuyển hoặc không có quyền truy cập',
      );
    }

    // Validate current status - only allow NEW or VIEWED
    if (
      application.status !== ApplicationStatus.NEW &&
      application.status !== ApplicationStatus.VIEWED
    ) {
      throw new BadRequestException(
        `Không thể thực hiện hành động này với đơn ứng tuyển có trạng thái "${application.status}". Chỉ cho phép với trạng thái "new" hoặc "viewed".`,
      );
    }

    // Map action to status
    const newStatus =
      action === ApplicationAction.SHORTLIST
        ? ApplicationStatus.SHORTLISTED
        : ApplicationStatus.REJECTED;

    // Update application status
    application.status = newStatus;
    application.statusUpdatedAt = new Date();
    await this.applicationRepository.save(application);

    // TODO: Optional - Send notification to candidate
    // This can be implemented later using a notification service
    // await this.notificationService.notifyApplicationStatusChange(application);

    const statusMessage =
      action === ApplicationAction.SHORTLIST
        ? 'Đã thêm vào danh sách phù hợp'
        : 'Đã từ chối hồ sơ';

    return {
      id: application.id,
      status: application.status,
      statusUpdatedAt: application.statusUpdatedAt,
      message: `${statusMessage} thành công`,
    };
  }
}
