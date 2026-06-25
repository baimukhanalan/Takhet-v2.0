import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AcademyService } from './academy.service';

class AcademySearchQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  q?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  letter?: string;
}

class AcademyEventDto {
  @IsString()
  @IsIn(['search', 'open_article', 'category_click', 'ai_cta', 'consultation_cta'])
  event!: 'search' | 'open_article' | 'category_click' | 'ai_cta' | 'consultation_cta';

  @IsString()
  @IsOptional()
  @MaxLength(160)
  target?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  query?: string;
}

class AcademyImportDto {
  @IsString()
  @MaxLength(100)
  slug!: string;

  @IsString()
  @MaxLength(80)
  categorySlug!: string;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(420)
  summary!: string;

  @IsString()
  body!: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  readMinutes?: number;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'review'])
  status?: 'draft' | 'review';

  @IsString()
  @MaxLength(240)
  sourceFile!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  sourceTool?: string;

  @IsString()
  @MaxLength(120)
  automationRunId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  createdBy?: string;

  @IsString()
  @IsOptional()
  @MaxLength(90)
  seoTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(180)
  seoDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  canonicalUrl?: string;
}

class AcademyRejectDto {
  @IsString()
  @IsOptional()
  @MaxLength(240)
  reason?: string;
}

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('overview')
  overview() {
    return this.academyService.overview();
  }

  @Get('search')
  search(@Query() query: AcademySearchQueryDto) {
    return this.academyService.search(query);
  }

  @Get('articles/:slug')
  articleBySlug(@Param('slug') slug: string) {
    return this.academyService.articleBySlug(slug);
  }

  @Post('events')
  trackEvent(@Body() dto: AcademyEventDto) {
    return this.academyService.trackEvent(dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('imports')
  createImport(@Body() dto: AcademyImportDto) {
    return this.academyService.createImport(dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('imports')
  listImports(@Query('status') status?: string) {
    return this.academyService.listImports(status);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('imports/:id/approve')
  approveImport(@Param('id') id: string, @Req() req: any) {
    return this.academyService.approveImport(id, req.user?.email || req.user?.id || 'admin');
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('imports/:id/reject')
  rejectImport(@Param('id') id: string, @Body() dto: AcademyRejectDto, @Req() req: any) {
    return this.academyService.rejectImport(id, dto.reason, req.user?.email || req.user?.id || 'admin');
  }
}
