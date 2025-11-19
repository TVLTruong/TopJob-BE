import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1763517094904 implements MigrationInterface {
  name = 'InitialSchema1763517094904';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "candidate_cvs" ("id" BIGSERIAL NOT NULL, "candidate_id" bigint NOT NULL, "file_name" character varying(255) NOT NULL, "file_url" text NOT NULL, "file_size" integer, "is_default" boolean NOT NULL DEFAULT false, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8a97e0f90c9d2e9e83cb6ff3d02" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_900a9933abcf94fc8855171aee" ON "candidate_cvs" ("candidate_id", "is_default") WHERE is_default = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd3cc60ff829e38b59b93bdcd8" ON "candidate_cvs" ("candidate_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employer_locations" ("id" BIGSERIAL NOT NULL, "employer_id" bigint NOT NULL, "is_headquarters" boolean NOT NULL DEFAULT false, "province" character varying(100) NOT NULL, "district" character varying(100) NOT NULL, "detailed_address" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f889105d0594ab33acb8fa2555f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_979b96f86c2024286831c68bcf" ON "employer_locations" ("employer_id", "is_headquarters") WHERE is_headquarters = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe59a6d1f73e6d0185f29261bc" ON "employer_locations" ("employer_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employer_pending_edits" ("id" BIGSERIAL NOT NULL, "employer_id" bigint NOT NULL, "field_name" character varying(100) NOT NULL, "old_value" text, "new_value" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e74f6a76168f8b26ad06db5f2c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c12c05a34b239a3c263704d2f9" ON "employer_pending_edits" ("field_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac76bf487a0d94b59ee78e8746" ON "employer_pending_edits" ("employer_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employers_company_size_enum" AS ENUM('startup', 'small', 'medium', 'large', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employers_status_enum" AS ENUM('pending_approval', 'active', 'banned')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employers_profile_status_enum" AS ENUM('approved', 'pending_edit_approval')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employers" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "full_name" character varying(255) NOT NULL, "work_title" character varying(255), "company_name" character varying(255) NOT NULL, "description" text, "website" text, "logo_url" text, "cover_image_url" text, "founded_year" integer, "company_size" "public"."employers_company_size_enum", "contact_email" character varying(255), "contact_phone" character varying(20), "linkedlnUrl" text, "facebookUrl" text, "xUrl" text, "is_approved" boolean NOT NULL DEFAULT false, "status" "public"."employers_status_enum" NOT NULL DEFAULT 'pending_approval', "profile_status" "public"."employers_profile_status_enum" NOT NULL DEFAULT 'approved', "benefits" text array, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b5db2de89197ada09695cbaf900" UNIQUE ("user_id"), CONSTRAINT "REL_b5db2de89197ada09695cbaf90" UNIQUE ("user_id"), CONSTRAINT "PK_f2c1aea3e8d7aa3c5fba949c97d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47fa913f7694cc39c84857ec64" ON "employers" ("company_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_368eb013319db2a84dce696163" ON "employers" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47fa913f7694cc39c84857ec64" ON "employers" ("company_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_368eb013319db2a84dce696163" ON "employers" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5db2de89197ada09695cbaf90" ON "employers" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs_categories" ("id" BIGSERIAL NOT NULL, "parent_id" bigint, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parentId" bigint, CONSTRAINT "UQ_28af4d9062d34e18ff2b05671eb" UNIQUE ("slug"), CONSTRAINT "PK_60c2f7df46ba466e86c01778c30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28af4d9062d34e18ff2b05671e" ON "jobs_categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28af4d9062d34e18ff2b05671e" ON "jobs_categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "saved_jobs" ("candidate_id" bigint NOT NULL, "job_id" bigint NOT NULL, "saved_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_55829e64a48f4b836a55ba3bf0c" PRIMARY KEY ("candidate_id", "job_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_job_type_enum" AS ENUM('full_time', 'part_time', 'freelance', 'internship', 'remote')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_experience_level_enum" AS ENUM('intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('draft', 'pending_approval', 'active', 'expired', 'closed', 'hidden', 'rejected', 'removed_by_admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" BIGSERIAL NOT NULL, "employer_id" bigint NOT NULL, "category_id" bigint NOT NULL, "location_id" bigint NOT NULL, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "requirements" text, "responsibilities" text, "nice_to_have" text, "salary_min" numeric(12,2), "salary_max" numeric(12,2), "is_negotiable" boolean NOT NULL DEFAULT false, "job_type" "public"."jobs_job_type_enum" NOT NULL, "experience_level" "public"."jobs_experience_level_enum", "positions_available" integer NOT NULL DEFAULT '1', "required_skills" text array, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'draft', "deadline" TIMESTAMP, "published_at" TIMESTAMP, "application_count" integer NOT NULL DEFAULT '0', "view_count" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "is_urgent" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ebf78eba11615c490d5db84451a" UNIQUE ("slug"), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5aba92c72d96d22a75ed1f962" ON "jobs" ("employer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_652419b4e4717ce9c426832c21" ON "jobs" ("category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a8e5385d0c88b833461095c97" ON "jobs" ("location_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ebf78eba11615c490d5db84451" ON "jobs" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0c30e3eb9649fe7fbcd336a63" ON "jobs" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_71fe7a9e52a7995581ecccb560" ON "jobs" ("deadline") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c42d35384096cdbb73a776669c" ON "jobs" ("published_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eaf821d41ad50bc54e13286f16" ON "jobs" ("status", "deadline") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."applications_status_enum" AS ENUM('new', 'viewed', 'shortlisted', 'rejected', 'hired', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" ("id" BIGSERIAL NOT NULL, "candidate_id" bigint NOT NULL, "job_id" bigint NOT NULL, "cv_id" bigint, "status" "public"."applications_status_enum" NOT NULL DEFAULT 'new', "status_updated_at" TIMESTAMP, "applied_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d1a0f9040afc46f7672793a391a" UNIQUE ("candidate_id", "job_id"), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b669b991b85b808f24b5734990" ON "applications" ("candidate_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8aba14d7f098c23ba06d869323" ON "applications" ("job_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fb9716acb31867c810af7032a0" ON "applications" ("applied_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ee114cee92e995a9e75c05cfb" ON "applications" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidates_gender_enum" AS ENUM('male', 'female', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidates_experience_level_enum" AS ENUM('intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidates_education_level_enum" AS ENUM('high_school', 'associate_degree', 'bachelor_degree', 'master_degree', 'doctoral_degree', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "candidates" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "full_name" character varying(255) NOT NULL, "gender" "public"."candidates_gender_enum", "date_of_birth" date, "phone_number" character varying(20), "avatar_url" text, "bio" text, "personal_url" text, "address_street" character varying(255), "address_district" character varying(100), "address_city" character varying(100), "address_country" character varying(100) NOT NULL DEFAULT 'Vietnam', "experience_years" integer NOT NULL DEFAULT '0', "experience_level" "public"."candidates_experience_level_enum", "education_level" "public"."candidates_education_level_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_94a5fe85e7f5bd0221fa7d6f19c" UNIQUE ("user_id"), CONSTRAINT "REL_94a5fe85e7f5bd0221fa7d6f19" UNIQUE ("user_id"), CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94a5fe85e7f5bd0221fa7d6f19" ON "candidates" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."approval_logs_target_type_enum" AS ENUM('employer_profile', 'employer_profile_edit', 'job_post')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."approval_logs_action_enum" AS ENUM('approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "approval_logs" ("id" BIGSERIAL NOT NULL, "admin_id" bigint NOT NULL, "target_type" "public"."approval_logs_target_type_enum" NOT NULL, "target_id" bigint NOT NULL, "action" "public"."approval_logs_action_enum" NOT NULL, "reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5ea530f8eff8a9e5e143c3b60be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb69845fa8d69268ed04e52858" ON "approval_logs" ("target_type", "target_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."otp_verifications_purpose_enum" AS ENUM('email_verification', 'password_reset', 'email_change')`,
    );
    await queryRunner.query(
      `CREATE TABLE "otp_verifications" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "otp_code" character varying(100) NOT NULL, "purpose" "public"."otp_verifications_purpose_enum" NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "is_verified" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "verified_at" TIMESTAMP, "user_id" bigint, "ip_address" inet, "user_agent" text, "attempt_count" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_9d485a4663596d18d118b35507" CHECK ("attempt_count" <= 5), CONSTRAINT "PK_91d17e75ac3182dba6701869b39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e13f2874d645c0cd9964d06008" ON "otp_verifications" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb0621df073fb05d6a4a59fe4b" ON "otp_verifications" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc89b494b5f5381575b1203033" ON "otp_verifications" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_062720ff9c437614c8eee8f3a3" ON "otp_verifications" ("email", "purpose") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('candidate', 'employer', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('pending_email_verification', 'pending_profile_completion', 'pending_approval', 'active', 'banned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending_email_verification', "is_verified" boolean NOT NULL DEFAULT false, "email_verified_at" TIMESTAMP, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6ee2d4bf901675877bb94977c" ON "users" ("role", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "companies_categories" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5b14f69842969e40fcae9bab876" UNIQUE ("slug"), CONSTRAINT "PK_ec61bb3e0ea76439cbeab741c91" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b14f69842969e40fcae9bab87" ON "companies_categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b14f69842969e40fcae9bab87" ON "companies_categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs_categories_closure" ("id_ancestor" bigint NOT NULL, "id_descendant" bigint NOT NULL, CONSTRAINT "PK_3d289b8bd23db46fba18257ebff" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_981e5a52f1b02a500f9f477484" ON "jobs_categories_closure" ("id_ancestor") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b464a3e80d27960bf37f1c5bc7" ON "jobs_categories_closure" ("id_descendant") `,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_cvs" ADD CONSTRAINT "FK_fd3cc60ff829e38b59b93bdcd8d" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_locations" ADD CONSTRAINT "FK_fe59a6d1f73e6d0185f29261bce" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_pending_edits" ADD CONSTRAINT "FK_ac76bf487a0d94b59ee78e8746e" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employers" ADD CONSTRAINT "FK_b5db2de89197ada09695cbaf900" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs_categories" ADD CONSTRAINT "FK_75f9275349e0f5f110059755c31" FOREIGN KEY ("parentId") REFERENCES "jobs_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_jobs" ADD CONSTRAINT "FK_a3550195e29799042b9c8313c83" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_jobs" ADD CONSTRAINT "FK_af5c8a7f3e11e8e646ea0f81a04" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_c5aba92c72d96d22a75ed1f9622" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_652419b4e4717ce9c426832c211" FOREIGN KEY ("category_id") REFERENCES "jobs_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_1a8e5385d0c88b833461095c979" FOREIGN KEY ("location_id") REFERENCES "employer_locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_b669b991b85b808f24b5734990a" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_8aba14d7f098c23ba06d8693235" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_dc56541877aa49408cdf38a7359" FOREIGN KEY ("cv_id") REFERENCES "candidate_cvs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD CONSTRAINT "FK_94a5fe85e7f5bd0221fa7d6f19c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval_logs" ADD CONSTRAINT "FK_109adc516e55279af3dd97876bd" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_verifications" ADD CONSTRAINT "FK_c7f1d281e1acc51e2a37889f5a9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs_categories_closure" ADD CONSTRAINT "FK_981e5a52f1b02a500f9f4774840" FOREIGN KEY ("id_ancestor") REFERENCES "jobs_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs_categories_closure" ADD CONSTRAINT "FK_b464a3e80d27960bf37f1c5bc7f" FOREIGN KEY ("id_descendant") REFERENCES "jobs_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs_categories_closure" DROP CONSTRAINT "FK_b464a3e80d27960bf37f1c5bc7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs_categories_closure" DROP CONSTRAINT "FK_981e5a52f1b02a500f9f4774840"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_verifications" DROP CONSTRAINT "FK_c7f1d281e1acc51e2a37889f5a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval_logs" DROP CONSTRAINT "FK_109adc516e55279af3dd97876bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_94a5fe85e7f5bd0221fa7d6f19c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_dc56541877aa49408cdf38a7359"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_8aba14d7f098c23ba06d8693235"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_b669b991b85b808f24b5734990a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_1a8e5385d0c88b833461095c979"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_652419b4e4717ce9c426832c211"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_c5aba92c72d96d22a75ed1f9622"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_jobs" DROP CONSTRAINT "FK_af5c8a7f3e11e8e646ea0f81a04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_jobs" DROP CONSTRAINT "FK_a3550195e29799042b9c8313c83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs_categories" DROP CONSTRAINT "FK_75f9275349e0f5f110059755c31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employers" DROP CONSTRAINT "FK_b5db2de89197ada09695cbaf900"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_pending_edits" DROP CONSTRAINT "FK_ac76bf487a0d94b59ee78e8746e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_locations" DROP CONSTRAINT "FK_fe59a6d1f73e6d0185f29261bce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_cvs" DROP CONSTRAINT "FK_fd3cc60ff829e38b59b93bdcd8d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b464a3e80d27960bf37f1c5bc7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_981e5a52f1b02a500f9f477484"`,
    );
    await queryRunner.query(`DROP TABLE "jobs_categories_closure"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b14f69842969e40fcae9bab87"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b14f69842969e40fcae9bab87"`,
    );
    await queryRunner.query(`DROP TABLE "companies_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6ee2d4bf901675877bb94977c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_062720ff9c437614c8eee8f3a3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc89b494b5f5381575b1203033"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb0621df073fb05d6a4a59fe4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e13f2874d645c0cd9964d06008"`,
    );
    await queryRunner.query(`DROP TABLE "otp_verifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."otp_verifications_purpose_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb69845fa8d69268ed04e52858"`,
    );
    await queryRunner.query(`DROP TABLE "approval_logs"`);
    await queryRunner.query(`DROP TYPE "public"."approval_logs_action_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."approval_logs_target_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94a5fe85e7f5bd0221fa7d6f19"`,
    );
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(
      `DROP TYPE "public"."candidates_education_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."candidates_experience_level_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."candidates_gender_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ee114cee92e995a9e75c05cfb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fb9716acb31867c810af7032a0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8aba14d7f098c23ba06d869323"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b669b991b85b808f24b5734990"`,
    );
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eaf821d41ad50bc54e13286f16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c42d35384096cdbb73a776669c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_71fe7a9e52a7995581ecccb560"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0c30e3eb9649fe7fbcd336a63"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ebf78eba11615c490d5db84451"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a8e5385d0c88b833461095c97"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_652419b4e4717ce9c426832c21"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5aba92c72d96d22a75ed1f962"`,
    );
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_experience_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_job_type_enum"`);
    await queryRunner.query(`DROP TABLE "saved_jobs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28af4d9062d34e18ff2b05671e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28af4d9062d34e18ff2b05671e"`,
    );
    await queryRunner.query(`DROP TABLE "jobs_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5db2de89197ada09695cbaf90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_368eb013319db2a84dce696163"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47fa913f7694cc39c84857ec64"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_368eb013319db2a84dce696163"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47fa913f7694cc39c84857ec64"`,
    );
    await queryRunner.query(`DROP TABLE "employers"`);
    await queryRunner.query(
      `DROP TYPE "public"."employers_profile_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."employers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."employers_company_size_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac76bf487a0d94b59ee78e8746"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c12c05a34b239a3c263704d2f9"`,
    );
    await queryRunner.query(`DROP TABLE "employer_pending_edits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe59a6d1f73e6d0185f29261bc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_979b96f86c2024286831c68bcf"`,
    );
    await queryRunner.query(`DROP TABLE "employer_locations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd3cc60ff829e38b59b93bdcd8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_900a9933abcf94fc8855171aee"`,
    );
    await queryRunner.query(`DROP TABLE "candidate_cvs"`);
  }
}
