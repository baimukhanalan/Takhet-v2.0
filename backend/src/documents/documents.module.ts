import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { CasesModule } from '../cases/cases.module';
import { DocumentEntity } from './document.entity';
import { DocumentVersionEntity } from './document-version.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [AuthModule, AuditModule, CasesModule, TypeOrmModule.forFeature([DocumentEntity, DocumentVersionEntity])],
  providers: [DocumentsService, PdfService],
  controllers: [DocumentsController],
  exports: [DocumentsService]
})
export class DocumentsModule {}
