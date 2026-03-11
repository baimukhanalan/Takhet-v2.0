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
      admin: { email: env.appAdminEmail, password: env.appAdminPassword, userId: 'admin-user-id' },
      doctor: { email: env.appDoctorEmail, password: env.appDoctorPassword, userId: 'doctor-user-id' },
      partner: { email: env.appPartnerEmail, password: env.appPartnerPassword, userId: 'partner-user-id' },
      patient: { email: env.appPatientEmail, password: env.appPatientPassword, userId: 'patient-user-id' }
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
