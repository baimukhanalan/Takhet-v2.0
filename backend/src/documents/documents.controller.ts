import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsObject, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { DocumentsService } from './documents.service';

class CreateDocumentDto {
  @IsString()
  caseId!: string;

  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsIn(['report', 'prescription', 'certificate'])
  type!: 'report' | 'prescription' | 'certificate';

  @IsString()
  @MinLength(3)
  title!: string;

  @IsObject()
  payloadJson!: Record<string, any>;
}

class UpdateDocumentDto {
  @IsObject()
  payloadJson!: Record<string, any>;
}

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('create')
  create(@Req() req: any, @Body() dto: CreateDocumentDto) {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only doctors and admins can create medical documents');
    }

    return this.documentsService.createDraft({
      ...dto,
      doctorId: req.user.role === 'doctor' ? req.user.id : dto.doctorId,
      actorId: req.user.id,
      actorRole: req.user.role
    });
  }

  @Get('my/list')
  my(@Req() req: any) {
    return this.documentsService.myDocuments(req.user.id);
  }

  @Get(':id')
  getById(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.getById(id, req.user.id);
  }

  @Patch(':id/update')
  updateDraft(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.updateDraft(id, dto.payloadJson, req.user.id);
  }

  @Post(':id/render-pdf')
  renderPdf(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.renderPdf(id, req.user.id);
  }

  @Post(':id/ready-for-sign')
  readyForSign(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.readyForSign(id, req.user.id);
  }

  @Post(':id/archive')
  archive(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.archive(id, req.user.id);
  }

  @Get(':id/download')
  download(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.download(id, req.user.id);
  }
}
