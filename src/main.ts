import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV === 'production') {
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Energy Ingestion Engine running on http://localhost:${port}/v1`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
