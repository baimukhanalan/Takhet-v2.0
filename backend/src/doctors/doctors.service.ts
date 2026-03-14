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

  listAll() {
    return this.doctorsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getDoctorProfile(doctorId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  async updateDoctorProfile(doctorId: string, bio: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    doctor.bio = bio;
    doctor.specialty = doctor.specialty || 'General';
    doctor.fullName = doctor.fullName || 'Doctor';
    const saved = await this.doctorsRepo.save(doctor);
    await this.auditService.log('doctor.profile.updated', doctorId, { bio });
    return saved;
  }

  async createPartnerDoctor(fullName: string, specialty: string) {
    const created = await this.doctorsRepo.save(this.doctorsRepo.create({ fullName, specialty, active: false, bio: '' }));
    return created;
  }

  async approveDoctor(id: string, adminId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.active = true;
    doctor.approvedBy = adminId;
    const saved = await this.doctorsRepo.save(doctor);
    await this.auditService.log('doctor.approved', adminId, { doctorId: id });
    return saved;
  }

  async setDoctorActive(id: string, active: boolean, actorId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.active = active;
    const saved = await this.doctorsRepo.save(doctor);
    await this.auditService.log('doctor.status.changed', actorId, { doctorId: id, active });
    return saved;
  }

  async getDoctorStats() {
    const total = await this.doctorsRepo.count();
    const active = await this.doctorsRepo.count({ where: { active: true } });
    const pending = total - active;
    return { total, active, pending };
  }
}
