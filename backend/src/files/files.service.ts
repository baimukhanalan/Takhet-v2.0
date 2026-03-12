import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '../config/env.config';

@Injectable()
export class FilesService {
  async upload(userId: string, fileName: string, fileBuffer: Buffer, mimeType: string) {
    const path = `${userId}/${Date.now()}-${fileName}`;
    const endpoint = `${env.supabaseUrl}/storage/v1/object/medical-files/${encodeURIComponent(path)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'false'
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Supabase storage upload failed: ${text}`);
    }

    return {
      path,
      bucket: 'medical-files'
    };
  }
}
