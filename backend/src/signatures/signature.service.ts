import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signature } from './signature.entity';

@Injectable()
export class SignatureService {
  constructor(@InjectRepository(Signature) private readonly signatureRepo: Repository<Signature>) {}

  sign(userId: string, documentId: string, payload: string) {
    const signatureHash = createHash('sha256').update(`${userId}:${documentId}:${payload}`).digest('hex');
    return this.signatureRepo.save(this.signatureRepo.create({ userId, documentId, signatureHash }));
  }

  async verify(signatureId: string) {
    const found = await this.signatureRepo.findOne({ where: { id: signatureId } });
    if (!found) throw new NotFoundException('Signature not found');
    return {
      signatureId: found.id,
      documentId: found.documentId,
      verificationResult: 'valid',
      signedAt: found.createdAt
    };
  }
}

