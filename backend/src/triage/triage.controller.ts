import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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
  create(@Req() req: any, @Body() dto: TriageDto) {
    return this.triageService.create(req.user.id, dto.symptoms);
  }
}
