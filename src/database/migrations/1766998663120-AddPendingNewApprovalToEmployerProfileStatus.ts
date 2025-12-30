import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingNewApprovalToEmployerProfileStatus1766998663120 implements MigrationInterface {
    name = 'AddPendingNewApprovalToEmployerProfileStatus1766998663120'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."employers_profile_status_enum" RENAME TO "employers_profile_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employers_profile_status_enum" AS ENUM('approved', 'pending_edit_approval', 'pending_new_approval')`);
        await queryRunner.query(`ALTER TABLE "employers" ALTER COLUMN "profile_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employers" ALTER COLUMN "profile_status" TYPE "public"."employers_profile_status_enum" USING "profile_status"::"text"::"public"."employers_profile_status_enum"`);
        await queryRunner.query(`ALTER TABLE "employers" ALTER COLUMN "profile_status" SET DEFAULT 'approved'`);
        await queryRunner.query(`DROP TYPE "public"."employers_profile_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employers_profile_status_enum_old" AS ENUM('approved', 'pending_edit_approval')`);
        await queryRunner.query(`ALTER TABLE "employers" ALTER COLUMN "profile_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employers" ALTER COLUMN "profile_status" TYPE "public"."employers_profile_status_enum_old" USING "profile_status"::"text"::"public"."employers_profile_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "employers" ALTER COLUMN "profile_status" SET DEFAULT 'approved'`);
        await queryRunner.query(`DROP TYPE "public"."employers_profile_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employers_profile_status_enum_old" RENAME TO "employers_profile_status_enum"`);
    }

}
