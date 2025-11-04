import { Module } from '@nestjs/common';
import { EmployersService } from './employers.service';
import { EmployersController } from './employers.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 IMPORT
import { Employer } from './entities/employer.entity'; // 👈 IMPORT
import { EmployerLocation } from './entities/employer-location.entity'; // 👈 IMPORT

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employer,
      EmployerLocation,
    ]), // 👈 ĐĂNG KÝ CẢ 2 ENTITY
  ],
  controllers: [EmployersController],
  providers: [EmployersService],
  exports: [EmployersService], // 👈 Export
})
export class EmployersModule {}