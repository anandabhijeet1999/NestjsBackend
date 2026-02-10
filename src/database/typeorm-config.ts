import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction,
    logging: process.env.NODE_ENV === 'development',
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
  };

  // Production (e.g. Render): require DATABASE_URL — localhost is not valid there
  if (isProduction && !process.env.DATABASE_URL) {
    const host = process.env.DATABASE_HOST ?? 'localhost';
    if (!host || host === 'localhost') {
      throw new Error(
        '[TypeORM] In production you must set DATABASE_URL. ' +
          'On Render: add env var DATABASE_URL from your Postgres service (Dashboard → Postgres → Internal Connection String).',
      );
    }
  }

  // Prefer DATABASE_URL when available (e.g. Render / cloud environments)
  if (process.env.DATABASE_URL) {
    return {
      ...baseConfig,
      url: process.env.DATABASE_URL,
      ssl: isProduction
        ? {
            rejectUnauthorized: false,
          }
        : false,
    };
  }

  // Fallback to individual connection params (local development or custom host)
  return {
    ...baseConfig,
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'energy_ingestion',
  };
}
