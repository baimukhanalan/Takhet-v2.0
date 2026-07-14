import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity, DocumentStatus, DocumentType } from './document.entity';
import { DocumentVersionEntity } from './document-version.entity';
import { AuditService } from '../audit/audit.service';
import { CasesService } from '../cases/cases.service';
import { PdfService } from './pdf.service';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity) private readonly documentRepo: Repository<DocumentEntity>,
    @InjectRepository(DocumentVersionEntity) private readonly versionRepo: Repository<DocumentVersionEntity>,
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly pdfService: PdfService
  ) {}

  async createDraft(input: {
    caseId: string;
    patientId: string;
    doctorId: string;
    type: DocumentType;
    title: string;
    payloadJson: Record<string, any>;
    actorId: string;
    actorRole?: string;
  }) {
    const relatedCase = await this.casesService.findById(input.caseId);
    if (!relatedCase) throw new NotFoundException('Case not found');
    if (relatedCase.patientId !== input.patientId) {
      throw new ForbiddenException('Document patient does not match case patient');
    }
    if (relatedCase.doctorId && relatedCase.doctorId !== input.doctorId) {
      throw new ForbiddenException('Document doctor does not match assigned case doctor');
    }
    if (input.actorRole !== 'admin' && input.actorId !== input.doctorId) {
      throw new ForbiddenException('Only the document doctor can author this document');
    }

    const created = await this.documentRepo.save(
      this.documentRepo.create({
        caseId: input.caseId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        type: input.type,
        title: input.title,
        status: 'draft'
      })
    );

    await this.versionRepo.save(
      this.versionRepo.create({
        documentId: created.id,
        versionNumber: 1,
        payloadJson: input.payloadJson,
        pdfPath: null,
        createdBy: input.actorId
      })
    );

    await this.auditService.log('document.created', input.actorId, { documentId: created.id, caseId: input.caseId, type: input.type });
    return created;
  }

  async renderPdf(documentId: string, actorId: string) {
    const doc = await this.requireDocument(documentId);
    const latest = await this.getLatestVersion(documentId);
    const pdfPath = `documents-draft/${doc.id}/v${latest.versionNumber}.pdf`;
    const diskPath = join(process.cwd(), 'storage', pdfPath);

    const html = this.renderHtmlTemplate(doc.title, latest.payloadJson);
    const result = await this.pdfService.generateDocumentPdf(doc.id, html, diskPath);

    latest.pdfPath = pdfPath;
    await this.versionRepo.save(latest);
    await this.auditService.log('document.rendered', actorId, { documentId, pdfPath, engine: result.engine });
    return { documentId, pdfPath, versionNumber: latest.versionNumber, engine: result.engine };
  }

  async readyForSign(documentId: string, actorId: string) {
    const doc = await this.requireDocument(documentId);
    doc.status = 'ready_for_sign';
    await this.documentRepo.save(doc);
    await this.auditService.log('document.ready_for_sign', actorId, { documentId });
    return doc;
  }

  async markSigned(documentId: string, actorId: string) {
    const doc = await this.requireDocument(documentId);
    const latest = await this.getLatestVersion(documentId);
    if (latest.pdfPath) {
      latest.pdfPath = latest.pdfPath.replace('documents-draft/', 'documents-signed/');
      await this.versionRepo.save(latest);
    }

    doc.status = 'signed';
    await this.documentRepo.save(doc);
    await this.casesService.setCaseStatus(doc.caseId, 'closed', actorId);
    await this.auditService.log('document.signed', actorId, { documentId, caseId: doc.caseId, pdfPath: latest.pdfPath });
    return doc;
  }

  async archive(documentId: string, actorId: string) {
    const doc = await this.requireDocument(documentId);
    doc.status = 'archived';
    await this.documentRepo.save(doc);
    await this.auditService.log('document.archived', actorId, { documentId });
    return doc;
  }

  async getById(documentId: string, actorId: string) {
    const doc = await this.requireDocument(documentId);
    const latest = await this.getLatestVersion(documentId);
    await this.auditService.log('document.viewed', actorId, { documentId });
    return { ...doc, latestVersion: latest };
  }

  async download(documentId: string, actorId: string) {
    const doc = await this.requireDocument(documentId);
    const latest = await this.getLatestVersion(documentId);
    await this.auditService.log('document.downloaded', actorId, { documentId, caseId: doc.caseId, pdfPath: latest.pdfPath });
    return {
      documentId: doc.id,
      status: doc.status,
      pdfPath: latest.pdfPath
    };
  }

  private renderHtmlTemplate(title: string, payloadJson: Record<string, any>) {
    const items = Object.entries(payloadJson || {})
      .map(([k, v]) => `<li><strong>${k}</strong>: ${typeof v === 'string' ? v : JSON.stringify(v)}</li>`)
      .join('');
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1>${title}</h1>
          <p>Generated by Takhet+ documents service</p>
          <ul>${items}</ul>
        </body>
      </html>
    `;
  }

  myDocuments(userId: string) {
    return this.documentRepo.find({ where: [{ patientId: userId }, { doctorId: userId }], order: { createdAt: 'DESC' } });
  }

  async updateDraft(documentId: string, payloadJson: Record<string, any>, actorId: string) {
    const doc = await this.requireDocument(documentId);
    if (doc.status !== 'draft') {
      throw new NotFoundException('Only draft documents can be updated');
    }
    const latest = await this.getLatestVersion(documentId);
    const created = await this.versionRepo.save(
      this.versionRepo.create({
        documentId,
        versionNumber: latest.versionNumber + 1,
        payloadJson,
        pdfPath: null,
        createdBy: actorId
      })
    );
    await this.auditService.log('document.updated', actorId, { documentId, versionNumber: created.versionNumber });
    return created;
  }

  private async requireDocument(documentId: string) {
    const doc = await this.documentRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private async getLatestVersion(documentId: string) {
    const latest = await this.versionRepo.findOne({ where: { documentId }, order: { versionNumber: 'DESC' } });
    if (!latest) throw new NotFoundException('Document version not found');
    return latest;
  }
}
