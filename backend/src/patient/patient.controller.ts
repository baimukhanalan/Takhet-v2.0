import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CasesService } from '../cases/cases.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';

class CreateCaseDto {
  @IsString()
  @MinLength(5)
  summary!: string;
}

@Controller('patient')
@UseGuards(AuthGuard, RolesGuard)
@Roles('patient')
export class PatientController {
  constructor(
    private readonly casesService: CasesService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService
  ) {}

  @Get('cases')
  myCases(@Req() req: any) {
    return this.casesService.findMy(req.user.id);
  }

  @Post('cases')
  createCase(@Req() req: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(req.user.id, dto.summary);
  }

  @Get('notifications')
  notifications(@Req() req: any) {
    return this.notificationsService.listByUser(req.user.id);
  }

  @Get('payments')
  payments(@Req() req: any) {
    return this.paymentsService.getMyPayments(req.user.id);
  }
}
