import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

@Injectable()
export class PdfService {
  async generateDocumentPdf(documentId: string, html: string, outputPath: string) {
    await mkdir(dirname(outputPath), { recursive: true });

    const generatedWithPuppeteer = await this.tryPuppeteer(html, outputPath);
    if (generatedWithPuppeteer) {
      return { outputPath, engine: 'puppeteer' as const };
    }

    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const buffer = this.createSimplePdfBuffer(plainText || `Takhet document ${documentId}`);
    await writeFile(outputPath, buffer);

    return { outputPath, engine: 'builtin-pdf-writer' as const };
  }

  private async tryPuppeteer(html: string, outputPath: string): Promise<boolean> {
    try {
      const imported = await (0, eval)('import(\'puppeteer\')');
      const browser = await imported.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
      await browser.close();
      return true;
    } catch {
      return false;
    }
  }

  private createSimplePdfBuffer(text: string): Buffer {
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const contentStream = `BT\n/F1 12 Tf\n50 770 Td\n(${escaped.slice(0, 3000)}) Tj\nET`;

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
      `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (const obj of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += obj;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }
}
