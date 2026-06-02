import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CasesService } from './cases.service';

class CreateCaseDto {
  @IsString()
  @MinLength(5)
  summary!: string;
}

class RespondDto {
  @IsIn(['in_review', 'closed'])
  status!: 'in_review' | 'closed';
}

class ConsultationSignalDto {
  @IsIn(['offer', 'answer', 'ice', 'leave'])
  type!: 'offer' | 'answer' | 'ice' | 'leave';

  @IsOptional()
  payload?: any;
}

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(req.user.id, dto.summary);
  }

  @UseGuards(AuthGuard)
  @Get('my')
  my(@Req() req: any) {
    return this.casesService.findMy(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/signals')
  signals(@Req() req: any, @Param('id') id: string, @Query('since') since?: string) {
    return this.casesService.getConsultationSignals(id, req.user.id, Number(since || 0));
  }

  @UseGuards(AuthGuard)
  @Post(':id/signals')
  addSignal(@Req() req: any, @Param('id') id: string, @Body() dto: ConsultationSignalDto) {
    return this.casesService.addConsultationSignal(id, req.user, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('doctor')
  @Patch(':id/respond')
  respond(@Req() req: any, @Param('id') id: string, @Body() dto: RespondDto) {
    return this.casesService.doctorRespond(id, req.user.id, dto.status);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('doctor', 'admin')
  @Patch(':id/close')
  close(@Req() req: any, @Param('id') id: string) {
    return this.casesService.closeCase(id, req.user.id);
  }
}
