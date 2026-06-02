import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBase64, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { FilesService } from './files.service';

class UploadDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsBase64()
  base64!: string;
}

class CreateResumableUploadDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024 * 1024)
  sizeBytes?: number;
}

@Controller('files')
export class FilesController {
  private readonly maxUploadBytes = 10 * 1024 * 1024;
  private readonly allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);

  constructor(private readonly filesService: FilesService) {}

  @UseGuards(AuthGuard)
  @Post('resumable')
  createResumableUpload(@Req() req: any, @Body() dto: CreateResumableUploadDto) {
    return this.filesService.createResumableUpload(req.user.id, dto.fileName, dto.mimeType, dto.sizeBytes);
  }

  @UseGuards(AuthGuard)
  @Post('upload')
  upload(@Req() req: any, @Body() dto: UploadDto) {
    if (!this.allowedMimeTypes.has(dto.mimeType)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (!/^[\w.\- ()]{1,120}$/.test(dto.fileName)) {
      throw new BadRequestException('Invalid file name');
    }

    const fileBuffer = Buffer.from(dto.base64, 'base64');
    if (!fileBuffer.length || fileBuffer.length > this.maxUploadBytes) {
      throw new BadRequestException('Invalid file size');
    }

    return this.filesService.upload(req.user.id, dto.fileName, fileBuffer, dto.mimeType);
  }
}
