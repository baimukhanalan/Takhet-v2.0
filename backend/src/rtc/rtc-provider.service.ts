import { Injectable } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { env } from '../config/env.config';

@Injectable()
export class RtcProviderService {
  createAccessToken(input: { roomName: string; userId: string; role: 'doctor' | 'patient' }) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60;

    return sign(
      {
        iss: env.rtcApiKey || 'takhet-local-rtc',
        sub: input.userId,
        nbf: now,
        exp,
        video: {
          room: input.roomName,
          canPublish: true,
          canSubscribe: true,
          metadata: { role: input.role }
        }
      },
      env.rtcApiSecret || env.appJwtSecret
    );
  }
}
