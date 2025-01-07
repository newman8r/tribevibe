import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailAndPassword1704676494039 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add email and password columns as nullable first
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email" character varying UNIQUE`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" character varying`);

        // Update existing users to have their email based on username
        await queryRunner.query(`
            UPDATE "user"
            SET email = username || '@temp.com',
                password = 'CHANGE_ME'
            WHERE email IS NULL
        `);

        // Make the columns non-nullable
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    }
} 