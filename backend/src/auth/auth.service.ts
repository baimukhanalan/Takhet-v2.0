import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { env } from '../config/env.config';

export type LoginRole = 'patient' | 'doctor' | 'partner' | 'admin';

@Injectable()
export class AuthService {
  verifyToken(authorization?: string) {
    if (!authorization) throw new UnauthorizedException('Authorization header required');
    const token = authorization.replace(/^Bearer\s+/i, '');

    try {
      const payload = verify(token, env.supabaseJwtSecret || env.appJwtSecret) as { sub: string; email: string; role: LoginRole };
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid JWT');
    }
  }

  login(email: string, password: string, role: LoginRole) {
    const credentials: Record<LoginRole, { email: string; password: string; userId: string }> = {
      admin: { email: env.appAdminEmail, password: env.appAdminPassword, userId: '11111111-1111-1111-1111-111111111111' },
      doctor: { email: env.appDoctorEmail, password: env.appDoctorPassword, userId: '22222222-2222-2222-2222-222222222222' },
      partner: { email: env.appPartnerEmail, password: env.appPartnerPassword, userId: '33333333-3333-3333-3333-333333333333' },
      patient: { email: env.appPatientEmail, password: env.appPatientPassword, userId: '44444444-4444-4444-4444-444444444444' }
    };

    const allowed = credentials[role];

    if (email !== allowed.email || password !== allowed.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = sign(
      {
        sub: allowed.userId,
        email,
        role
      },
      env.supabaseJwtSecret || env.appJwtSecret,
      { expiresIn: '24h' }
    );

    return {
      access_token: token,
      user: {
        id: allowed.userId,
        email,
        role
      }
    };
  }
}
