import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { TelemetryService } from './telemetry/telemetry.service';

const express = require('express');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  const telemetryService = app.get(TelemetryService);
  const allowedOrigins = new Set([
    'https://takhet.com',
    'https://www.takhet.com',
    'https://api.takhet.com',
    'https://enterprise.takhet.com',
    'https://labs.takhet.com',
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
  const isAllowedVercelPreviewOrigin = (origin: string) =>
    origin.startsWith('https://') &&
    origin.endsWith('.vercel.app') &&
    origin.includes('baimukhanalan1-5914s-projects');

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.has(origin) || isAllowedVercelPreviewOrigin(origin)) {
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
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(self), fullscreen=(self), clipboard-read=(), clipboard-write=(self), accelerometer=(), gyroscope=(), magnetometer=(), usb=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
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

      const apiPrefixes = [
        '/auth',
        '/doctors',
        '/doctor',
        '/patient',
        '/partner',
        '/admin',
        '/realtime',
        '/api',
        '/payments',
        '/files',
        '/cases',
        '/notifications',
        '/profiles',
        '/community',
        '/enterprise',
        '/labs',
        '/academy',
        '/guest',
        '/triage',
        '/ai'
      ];
      const isApiRequest = apiPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`));

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
