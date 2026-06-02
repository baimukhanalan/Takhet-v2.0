import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsObject, IsOptional } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { ProfilesService } from './profiles.service';

class UpdateAppStateDto {
  @IsOptional()
  @IsArray()
  aiBrowserHistory?: string[];

  @IsOptional()
  @IsObject()
  aiBrowserCache?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  takhetAiChatArchive?: unknown[];
}

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('app-state')
  appState(@Req() req: any) {
    return this.profilesService.getAppState(req.user.id);
  }

  @Patch('app-state')
  updateAppState(@Req() req: any, @Body() dto: UpdateAppStateDto) {
    return this.profilesService.updateAppState(req.user.id, dto);
  }
}
