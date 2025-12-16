// src/common/ownership/ownership.module.ts

import { Module } from '@nestjs/common';
import { OwnershipService } from './ownership.service';

/**
 * Ownership Module
 *
 * Cung cấp OwnershipService để các module khác có thể inject và sử dụng
 *
 * Usage trong module khác:
 * @Module({
 *   imports: [OwnershipModule],
 *   // ...
 * })
 */
@Module({
  providers: [OwnershipService],
  exports: [OwnershipService],
})
export class OwnershipModule {}
