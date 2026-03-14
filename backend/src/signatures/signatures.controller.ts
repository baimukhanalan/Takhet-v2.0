import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { DocumentsService } from '../documents/documents.service';
import { SignatureService } from './signature.service';

class SignDto {
  @IsString()
  @MinLength(3)
  payload!: string;
}

@Controller('signatures')
@UseGuards(AuthGuard)
export class SignaturesController {
  constructor(
    private readonly signatureService: SignatureService,
    private readonly documentsService: DocumentsService
  ) {}

  @Post('start/:documentId')
  start(@Req() req: any, @Param('documentId') documentId: string) {
    return {
      documentId,
      signerUserId: req.user.id,
      status: 'ready_for_sign'
    };
  }

  @Post('complete/:documentId')
  async complete(@Req() req: any, @Param('documentId') documentId: string, @Body() dto: SignDto) {
    const signature = await this.signatureService.sign(req.user.id, documentId, dto.payload);
    await this.documentsService.markSigned(documentId, req.user.id);
    return signature;
  }

  @Post('verify/:signatureId')
  verify(@Param('signatureId') signatureId: string) {
    return this.signatureService.verify(signatureId);
  }
}
