import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsBase64, IsString } from 'class-validator';
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

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(AuthGuard)
  @Post('upload')
  upload(@Req() req: any, @Body() dto: UploadDto) {
    const fileBuffer = Buffer.from(dto.base64, 'base64');
    return this.filesService.upload(req.user.id, dto.fileName, fileBuffer, dto.mimeType);
  }
}
