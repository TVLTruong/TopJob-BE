import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEnumJobStatus1767351153771 implements MigrationInterface {
    name = 'UpdateEnumJobStatus1767351153771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."jobs_status_enum" RENAME TO "jobs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_status_enum" AS ENUM('draft', 'pending_approval', 'active', 'expired', 'closed', 'hidden', 'rejected', 'removed_by_admin', 'removed_by_employer')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "public"."jobs_status_enum" USING "status"::"text"::"public"."jobs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."jobs_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_status_enum_old" AS ENUM('draft', 'pending_approval', 'active', 'expired', 'closed', 'hidden', 'rejected', 'removed_by_admin')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "public"."jobs_status_enum_old" USING "status"::"text"::"public"."jobs_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_status_enum_old" RENAME TO "jobs_status_enum"`);
    }

}
