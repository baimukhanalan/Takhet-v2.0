import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signature } from './signature.entity';
import { SignatureService } from './signature.service';
import { SignaturesController } from './signatures.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([Signature]), DocumentsModule],
  providers: [SignatureService],
  controllers: [SignaturesController],
  exports: [SignatureService]
})
export class SignatureModule {}
