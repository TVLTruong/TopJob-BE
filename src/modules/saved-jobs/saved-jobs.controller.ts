// src/modules/saved-jobs/saved-jobs.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SavedJobsService } from './saved-jobs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Query } from '@nestjs/common';

@ApiTags('Saved Jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Controller('candidates/me/saved-jobs')
export class SavedJobsController {
  constructor(private readonly savedJobsService: SavedJobsService) {}

  /**
   * Get all saved jobs for current candidate
   * GET /candidates/saved-jobs
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all saved jobs for current candidate',
  })
  @ApiResponse({
    status: 200,
    description: 'List of saved jobs with pagination',
  })
  async getSavedJobs(
    @Request() req: any,
    @Query() pagination: PaginationDto,
  ) {
    const userId = req.user.id;
    return this.savedJobsService.getSavedJobs(userId, pagination);
  }

  /**
   * Save a job
   * POST /candidates/saved-jobs/:jobId
   */
  @Post(':jobId')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save a job for current candidate',
  })
  @ApiResponse({
    status: 201,
    description: 'Job saved successfully',
  })
  async saveJob(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    const userId = req.user.id;
    return this.savedJobsService.saveJob(userId, jobId);
  }

  /**
   * Unsave a job
   * DELETE /candidates/saved-jobs/:jobId
   */
  @Delete(':jobId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unsave a job for current candidate',
  })
  @ApiResponse({
    status: 200,
    description: 'Job unsaved successfully',
  })
  async unsaveJob(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    const userId = req.user.id;
    return this.savedJobsService.unsaveJob(userId, jobId);
  }

  /**
   * Check if a job is saved
   * GET /candidates/saved-jobs/:jobId/check
   */
  @Get(':jobId/check')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if a job is saved for current candidate',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns true if job is saved, false otherwise',
  })
  async checkJobSaved(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    const userId = req.user.id;
    return this.savedJobsService.checkJobSaved(userId, jobId);
  }
}
