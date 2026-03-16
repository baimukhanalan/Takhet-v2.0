import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorsRepo: Repository<Doctor>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource
  ) {}

  listActive() {
    return this.doctorsRepo.find({ where: { active: true } });
  }

  listAll() {
    return this.doctorsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getClinicByPartnerUser(partnerUserId: string) {
    const rows = await this.dataSource.query('select id from clinics where partner_user_id = $1 limit 1', [partnerUserId]);
    return rows?.[0]?.id || null;
  }

  listByClinic(clinicId: string) {
    return this.doctorsRepo.find({ where: { clinicId }, order: { createdAt: 'DESC' } });
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

  async createPartnerDoctor(fullName: string, specialty: string, clinicId: string) {
    const created = await this.doctorsRepo.save(this.doctorsRepo.create({ fullName, specialty, active: false, bio: '', clinicId }));
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

  async setDoctorActive(id: string, active: boolean, actorId: string, clinicId?: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (clinicId && doctor.clinicId !== clinicId) throw new NotFoundException('Doctor not in your clinic');
    doctor.active = active;
    const saved = await this.doctorsRepo.save(doctor);
    await this.auditService.log('doctor.status.changed', actorId, { doctorId: id, active });
    return saved;
  }

  async getDoctorStats(clinicId?: string) {
    const where = clinicId ? { clinicId } : undefined;
    const total = await this.doctorsRepo.count(where ? { where } : undefined as any);
    const active = await this.doctorsRepo.count(where ? { where: { clinicId, active: true } as any } : { where: { active: true } });
    const pending = total - active;
    return { total, active, pending };
  }
}
