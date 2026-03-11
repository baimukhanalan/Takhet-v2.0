import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorsRepo: Repository<Doctor>,
    private readonly auditService: AuditService
  ) {}

  listActive() {
    return this.doctorsRepo.find({ where: { active: true } });
  }

  async getDoctorProfile(doctorId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  async updateDoctorProfile(doctorId: string, bio: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    doctor.specialty = doctor.specialty || 'General';
    doctor.fullName = doctor.fullName || 'Doctor';
    await this.auditService.log('doctor.profile.updated', doctorId, { bio });
    return doctor;
  }

  async createPartnerDoctor(fullName: string, specialty: string) {
    const created = await this.doctorsRepo.save(this.doctorsRepo.create({ fullName, specialty, active: false }));
    return created;
  }

  async approveDoctor(id: string, adminId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.active = true;
    const saved = await this.doctorsRepo.save(doctor);
    await this.auditService.log('doctor.approved', adminId, { doctorId: id });
    return saved;
  }
}
