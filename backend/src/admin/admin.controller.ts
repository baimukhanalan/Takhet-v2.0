import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UsersService } from '../users/users.service';
import { CasesService } from '../cases/cases.service';
import { PaymentsService } from '../payments/payments.service';
import { DoctorsService } from '../doctors/doctors.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

class BroadcastDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  body!: string;
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly casesService: CasesService,
    private readonly paymentsService: PaymentsService,
    private readonly doctorsService: DoctorsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [users, cases, payments, doctors] = await Promise.all([
      this.usersService.findAll(),
      this.casesService.getDashboardStats(),
      this.paymentsService.findAllPayments(),
      this.doctorsService.getDoctorStats()
    ]);

    return {
      usersTotal: users.length,
      cases,
      paymentsTotal: payments.length,
      doctors
    };
  }

  @Get('users')
  users() {
    return this.usersService.findAll();
  }

  @Get('cases')
  cases() {
    return this.casesService.findAll();
  }

  @Get('payments')
  payments() {
    return this.paymentsService.findAllPayments();
  }

  @Get('audit')
  audit() {
    return this.auditService.recent(200);
  }

  @Patch('doctor/:id/approve')
  approveDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.approveDoctor(id, req.user.id);
  }

  @Patch('case/:id/assign/:doctorId')
  assignCase(@Param('id') id: string, @Param('doctorId') doctorId: string, @Req() req: any) {
    return this.casesService.assignDoctor(id, doctorId, req.user.id);
  }

  @Delete('user/:id')
  deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.softDelete(id, req.user.id);
  }

  @Post('notifications/broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.notificationsService.broadcast(dto.title, dto.body);
  }
}
