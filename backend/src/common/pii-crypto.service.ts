import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../config/env.config';

@Injectable()
export class PiiCryptoService {
  private readonly key = createHash('sha256').update(env.piiEncryptionKey).digest();

  encrypt(value: string) {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string) {
    const [ivHex, dataHex] = payload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
