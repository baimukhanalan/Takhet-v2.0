import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { env } from '../config/env.config';

@Injectable()
export class FilesService {
  private readonly bucket = 'medical-files';
  private readonly maxResumableBytes = 5 * 1024 * 1024 * 1024;
  private readonly resumableChunkSize = 6 * 1024 * 1024;
  private supabaseClient: SupabaseClient | null = null;

  private getSupabaseClient() {
    if (!env.supabaseUrl || !env.supabaseServiceKey) {
      throw new InternalServerErrorException('Supabase storage is not configured');
    }

    if (!this.supabaseClient) {
      this.supabaseClient = createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }

    return this.supabaseClient;
  }

  private sanitizeFileName(fileName: string) {
    const fallback = 'medical-file';
    const normalized = String(fileName || fallback)
      .normalize('NFKD')
      .replace(/[^\w.\- ()]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120);

    return normalized || fallback;
  }

  private getFileExtension(fileName: string) {
    const normalized = fileName.toLowerCase();
    if (normalized.endsWith('.nii.gz')) return 'nii.gz';
    return normalized.split('.').pop() || '';
  }

  private assertSupportedFile(fileName: string, mimeType: string, sizeBytes?: number) {
    const extension = this.getFileExtension(fileName);
    const allowedExtensions = new Set([
      'pdf',
      'jpg',
      'jpeg',
      'png',
      'webp',
      'txt',
      'doc',
      'docx',
      'edf',
      'bdf',
      'dcm',
      'dicom',
      'nii',
      'nii.gz',
      'zip'
    ]);
    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/dicom',
      'application/octet-stream',
      'application/zip',
      'application/x-zip-compressed'
    ]);

    if (!allowedExtensions.has(extension) && !allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (sizeBytes && (sizeBytes <= 0 || sizeBytes > this.maxResumableBytes)) {
      throw new BadRequestException('Invalid file size');
    }
  }

  async createResumableUpload(userId: string, fileName: string, mimeType: string, sizeBytes?: number) {
    this.assertSupportedFile(fileName, mimeType, sizeBytes);

    const safeFileName = this.sanitizeFileName(fileName);
    const datePrefix = new Date().toISOString().slice(0, 10);
    const nonce = randomBytes(6).toString('hex');
    const path = `${userId}/${datePrefix}/${Date.now()}-${nonce}-${safeFileName}`;

    const { data, error } = await this.getSupabaseClient()
      .storage
      .from(this.bucket)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      throw new InternalServerErrorException(`Supabase signed upload failed: ${error?.message || 'missing token'}`);
    }

    return {
      bucket: this.bucket,
      path,
      token: data.token,
      endpoint: `${env.supabaseStorageHostname.replace(/\/$/, '')}/storage/v1/upload/resumable`,
      chunkSize: this.resumableChunkSize,
      expiresInSeconds: 2 * 60 * 60
    };
  }

  async upload(userId: string, fileName: string, fileBuffer: Buffer, mimeType: string) {
    const safeFileName = this.sanitizeFileName(fileName);
    const path = `${userId}/${Date.now()}-${safeFileName}`;
    const endpoint = `${env.supabaseUrl}/storage/v1/object/${this.bucket}/${encodeURIComponent(path)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'false'
      },
      body: new Uint8Array(fileBuffer)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Supabase storage upload failed: ${text}`);
    }

    return {
      path,
      bucket: this.bucket
    };
  }
}
