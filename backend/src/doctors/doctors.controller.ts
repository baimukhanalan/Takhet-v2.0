import { Controller, Get, Param } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  list() {
    return this.doctorsService.listActive();
  }

  @Get('catalog')
  catalog() {
    return this.doctorsService.listActive();
  }

  @Get(':id')
  profile(@Param('id') id: string) {
    return this.doctorsService.getPublicDoctorProfile(id);
  }
}
