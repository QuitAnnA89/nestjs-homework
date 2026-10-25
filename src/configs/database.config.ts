import { type ConfigType, registerAs } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CreateUsers1791479233933 } from '../database/migrations/1791479233933-create-users.js';
import { CreateRefreshTokens1791659020534 } from '../database/migrations/1791659020534-create-refresh-tokens.js';
import { AddRefreshTokensUserIdIndex1792787822275 } from '../database/migrations/1792787822275-add-refresh-tokens-user-id-index.js';

export async function getTypeOrmConfig(
  database: ConfigType<typeof databaseConfig>,
): Promise<TypeOrmModuleOptions> {
  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.database,
    autoLoadEntities: true,
    synchronize: false,
    migrations: [
      CreateUsers1791479233933,
      CreateRefreshTokens1791659020534,
      AddRefreshTokensUserIdIndex1792787822275,
    ],
    migrationsRun: true,
  };
}
export const databaseConfig = registerAs('database', () => ({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
}));
