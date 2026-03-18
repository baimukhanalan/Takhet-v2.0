import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MinLength } from 'class-validator';
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
  @IsIn(['consultation_finished', 'closed'])
  status!: 'consultation_finished' | 'closed';
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
