import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTechnologiesToEmployer1735046400000
  implements MigrationInterface
{
  name = 'AddTechnologiesToEmployer1735046400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employers" ADD "technologies" text array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employers" DROP COLUMN "technologies"`,
    );
  }
}
