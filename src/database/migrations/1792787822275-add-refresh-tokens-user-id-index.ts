import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokensUserIdIndex1792787822275 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
			CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)
			`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX idx_refresh_tokens_user_id');
  }
}
