import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateJobEntity1767214877360 implements MigrationInterface {
    name = 'UpdateJobEntity1767214877360'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "responsibilities"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "responsibilities" text array`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "requirements"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "requirements" text array`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "nice_to_have"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "nice_to_have" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "nice_to_have"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "nice_to_have" text`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "requirements"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "requirements" text`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "responsibilities"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "responsibilities" text`);
    }

}
