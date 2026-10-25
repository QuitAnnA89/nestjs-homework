import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1791479233933 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
			CREATE TABLE users(
				id         		SERIAL PRIMARY KEY,
				login 		 		VARCHAR(12) NOT NULL UNIQUE,
				email    	 		VARCHAR(30) NOT NULL UNIQUE,
				password_hash TEXT NOT NULL,
				age						INTEGER,
				description   VARCHAR(1000),
  			created_at		TIMESTAMPTZ NOT NULL DEFAULT now(),
				updated_at		TIMESTAMPTZ NOT NULL DEFAULT now(),
				deleted_at		TIMESTAMPTZ
			)
			`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE users');
  }
}
