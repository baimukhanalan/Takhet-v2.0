import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { TelemetryService } from './telemetry/telemetry.service';

const express = require('express');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const telemetryService = app.get(TelemetryService);
  const allowedOrigins = new Set([
    'https://takhet.com',
    'https://www.takhet.com',
    'https://api.takhet.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4173',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080'
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  });
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    next();
  });
  app.use((req: any, _res: any, next: any) => {
    telemetryService.recordRequest(req.path);
    next();
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const frontendDistPath = join(process.cwd(), '..', 'frontend', 'dist');
  if (existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath, { index: false }));

    app.use((req: any, res: any, next: any) => {
      if (req.method !== 'GET') {
        next();
        return;
      }

      const isApiRequest =
        req.path === '/auth/login' ||
        req.path === '/auth/register' ||
        req.path === '/auth/session' ||
        req.path === '/auth/logout' ||
        req.path === '/doctors' ||
        req.path.startsWith('/doctors/') ||
        req.path === '/doctor' ||
        req.path.startsWith('/doctor/') ||
        req.path === '/patient' ||
        req.path.startsWith('/patient/') ||
        req.path === '/partner' ||
        req.path.startsWith('/partner/') ||
        req.path === '/admin' ||
        req.path.startsWith('/admin/') ||
        req.path === '/realtime' ||
        req.path.startsWith('/realtime/') ||
        req.path === '/api' ||
        req.path.startsWith('/api/');

      if (isApiRequest) {
        next();
        return;
      }

      res.sendFile(join(frontendDistPath, 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Server started on port ${port}`, 'Bootstrap');
}

bootstrap();
