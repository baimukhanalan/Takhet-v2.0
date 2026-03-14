import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { TriageService } from './triage.service';

class TriageDto {
  @IsString()
  @MinLength(3)
  symptoms!: string;

  @IsOptional()
  @IsString()
  patientId?: string;
}

@Controller('triage')
export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Headers('x-patient-id') patientHeader: string | undefined, @Body() dto: TriageDto) {
    const patientId = dto.patientId || patientHeader || 'master-user-id';
    return this.triageService.create(patientId, dto.symptoms);
  }
}
