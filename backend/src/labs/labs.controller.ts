import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { LabsService } from './labs.service';

class MembershipOrderDto {
  @IsString()
  @IsIn(['CORE', 'PLUS', 'EXECUTIVE'])
  code!: 'CORE' | 'PLUS' | 'EXECUTIVE';

  @IsString()
  @IsOptional()
  @IsIn(['partner_lab', 'home_draw'])
  bloodDrawMode?: 'partner_lab' | 'home_draw';
}

class LabResultDto {
  @IsString()
  @IsIn(['pdf', 'manual', 'api'])
  source!: 'pdf' | 'manual' | 'api';

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsObject()
  @IsOptional()
  biomarkers?: Record<string, unknown>;
}

class PhysicianReviewDto {
  @IsString()
  labResultId!: string;

  @IsString()
  status!: 'approved' | 'edited' | 'commented';

  @IsString()
  @IsOptional()
  comment?: string;
}

class GenerateReportDto {
  @IsString()
  @IsOptional()
  labResultId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ai_summary', 'physician_review', 'executive'])
  reportType?: 'ai_summary' | 'physician_review' | 'executive';
}

class FamilyProfileDto {
  @IsString()
  fullName!: string;

  @IsString()
  relation!: string;
}

class LabsLoginDto {
  @IsString()
  identifier!: string;

  @IsString()
  password!: string;

  @IsString()
  @IsIn(['member', 'physician', 'admin', 'family'])
  role!: 'member' | 'physician' | 'admin' | 'family';
}

@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get('memberships')
  memberships() {
    return this.labsService.memberships();
  }

  @Post('memberships/subscribe')
  @UseGuards(AuthGuard)
  subscribeMembership(@Req() req: any, @Body() dto: MembershipOrderDto) {
    return this.labsService.createMembershipOrder(req.user?.id, dto);
  }

  @Post('auth/login')
  async labsLogin(@Body() dto: LabsLoginDto, @Res({ passthrough: true }) res: any) {
    const session = await this.labsService.labsLogin(dto.identifier, dto.password, dto.role);
    const cookie = this.labsService.buildLabsSessionCookie(session.accessToken);
    res.cookie(cookie.name, cookie.value, cookie.options);
    return { authenticated: true, user: session.user };
  }

  @Get('auth/session')
  labsSession(@Req() req: any) {
    return this.labsService.labsSession(req.headers.cookie);
  }

  @Post('auth/logout')
  labsLogout(@Res({ passthrough: true }) res: any) {
    const cookie = this.labsService.labsLogoutCookie();
    res.clearCookie(cookie.name, cookie.options);
    return { ok: true };
  }

  @Get('portal/dashboard')
  async labsPortalDashboard(@Req() req: any) {
    const session = await this.labsService.labsSession(req.headers.cookie);
    return this.labsService.labsPortalDashboard(session.user);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard)
  dashboard(@Req() req: any) {
    return this.labsService.dashboard(req.user?.id);
  }

  @Get('biomarkers')
  @UseGuards(AuthGuard)
  biomarkers(@Req() req: any) {
    return this.labsService.biomarkers(req.user?.id);
  }

  @Get('health-systems')
  @UseGuards(AuthGuard)
  healthSystems(@Req() req: any) {
    return this.labsService.healthSystems(req.user?.id);
  }

  @Get('issues')
  @UseGuards(AuthGuard)
  issues(@Req() req: any) {
    return this.labsService.monitoredIssues(req.user?.id);
  }

  @Get('insights')
  @UseGuards(AuthGuard)
  insights(@Req() req: any) {
    return this.labsService.aiInsights(req.user?.id);
  }

  @Get('protocol')
  @UseGuards(AuthGuard)
  protocol(@Req() req: any) {
    return this.labsService.protocol(req.user?.id);
  }

  @Get('family')
  @UseGuards(AuthGuard)
  family(@Req() req: any) {
    return this.labsService.family(req.user?.id);
  }

  @Post('family')
  @UseGuards(AuthGuard)
  addFamily(@Req() req: any, @Body() dto: FamilyProfileDto) {
    return this.labsService.addFamilyProfile(req.user?.id, dto);
  }

  @Get('reports')
  @UseGuards(AuthGuard)
  reports(@Req() req: any) {
    return this.labsService.reports(req.user?.id);
  }

  @Post('reports/generate')
  @UseGuards(AuthGuard)
  generateReport(@Req() req: any, @Body() dto: GenerateReportDto) {
    return this.labsService.generateReport(req.user?.id, dto);
  }

  @Post('lab-results')
  @UseGuards(AuthGuard)
  createLabResult(@Req() req: any, @Body() dto: LabResultDto) {
    return this.labsService.createLabResult(req.user?.id, dto);
  }

  @Post('physician-reviews')
  @UseGuards(AuthGuard)
  createPhysicianReview(@Req() req: any, @Body() dto: PhysicianReviewDto) {
    return this.labsService.createPhysicianReview(req.user?.id, dto);
  }

  @Get('physician/review-queue')
  @UseGuards(AuthGuard)
  physicianReviewQueue(@Req() req: any) {
    return this.labsService.physicianReviewQueue(req.user?.id);
  }

  @Get('admin/overview')
  @UseGuards(AuthGuard)
  adminOverview(@Req() req: any) {
    return this.labsService.adminOverview(req.user?.id);
  }
}
