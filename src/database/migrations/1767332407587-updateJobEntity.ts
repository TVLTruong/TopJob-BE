import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateJobEntity1767332407587 implements MigrationInterface {
    name = 'UpdateJobEntity1767332407587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_c5aba92c72d96d22a75ed1f9622"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71fe7a9e52a7995581ecccb560"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c42d35384096cdbb73a776669c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eaf821d41ad50bc54e13286f16"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "is_negotiable"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "job_type"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_job_type_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "experience_level"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_experience_level_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "positions_available"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "required_skills"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "deadline"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "application_count"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "view_count"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "is_featured"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "benefits" text array`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_employmenttype_enum" AS ENUM('full_time', 'part_time', 'freelance', 'internship', 'contract')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "employmentType" "public"."jobs_employmenttype_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_workmode_enum" AS ENUM('onsite', 'remote', 'hybrid')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "workMode" "public"."jobs_workmode_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "quantity" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "experienceYearsMin" integer`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_experiencelevel_enum" AS ENUM('intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "experienceLevel" "public"."jobs_experiencelevel_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "isNegotiable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "isSalaryVisible" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "salaryCurrency" character varying(10) NOT NULL DEFAULT 'VND'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "expired_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "viewCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "applyCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "saveCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "is_hot" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_13ffcd5ea43723305d77d387b1" ON "jobs" ("expired_at") `);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_c5aba92c72d96d22a75ed1f9622" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_c5aba92c72d96d22a75ed1f9622"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_13ffcd5ea43723305d77d387b1"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "is_hot"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "saveCount"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "applyCount"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "viewCount"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "expired_at"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "salaryCurrency"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "isSalaryVisible"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "isNegotiable"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "experienceLevel"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_experiencelevel_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "experienceYearsMin"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "workMode"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_workmode_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "employmentType"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_employmenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "benefits"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "is_featured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "view_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "application_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "deadline" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "required_skills" text array`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "positions_available" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_experience_level_enum" AS ENUM('intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "experience_level" "public"."jobs_experience_level_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_job_type_enum" AS ENUM('full_time', 'part_time', 'freelance', 'internship', 'remote')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "job_type" "public"."jobs_job_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "is_negotiable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_eaf821d41ad50bc54e13286f16" ON "jobs" ("status", "deadline") `);
        await queryRunner.query(`CREATE INDEX "IDX_c42d35384096cdbb73a776669c" ON "jobs" ("published_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_71fe7a9e52a7995581ecccb560" ON "jobs" ("deadline") `);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_c5aba92c72d96d22a75ed1f9622" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
