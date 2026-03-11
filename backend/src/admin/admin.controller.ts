import { Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UsersService } from '../users/users.service';
import { CasesService } from '../cases/cases.service';
import { PaymentsService } from '../payments/payments.service';
import { DoctorsService } from '../doctors/doctors.service';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly casesService: CasesService,
    private readonly paymentsService: PaymentsService,
    private readonly doctorsService: DoctorsService
  ) {}

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

  @Patch('doctor/:id/approve')
  approveDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.approveDoctor(id, req.user.id);
  }

  @Delete('user/:id')
  deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.softDelete(id, req.user.id);
  }
}
