import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signature } from './signature.entity';
import { SignatureService } from './signature.service';

@Module({
  imports: [TypeOrmModule.forFeature([Signature])],
  providers: [SignatureService],
  exports: [SignatureService]
})
export class SignatureModule {}
