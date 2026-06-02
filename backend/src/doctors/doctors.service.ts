import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { AuditService } from '../audit/audit.service';
import { ProfilesService } from '../profiles/profiles.service';
import { User } from '../users/user.entity';
import { randomBytes, randomUUID, scryptSync } from 'crypto';
import { CaseEntity } from '../cases/case.entity';

const DEFAULT_CLINIC_NAME = 'Takhet+ Network';
const LEGACY_PARTNER_ORGANIZATION_NAME = 'Takhet+ Partner Clinic';
type CatalogAudience = 'doctor' | 'mental' | 'both';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorsRepo: Repository<Doctor>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(CaseEntity) private readonly casesRepo: Repository<CaseEntity>,
    private readonly auditService: AuditService,
    private readonly profilesService: ProfilesService,
    private readonly dataSource: DataSource
  ) {}

  async listActive() {
    const list = await this.doctorsRepo.find({ where: { verified: true }, order: { createdAt: 'DESC' } });
    const publicDoctors = await Promise.all(
      list.map(async (doctor) => {
        const setup = await this.profilesService.getDoctorProfileSetupState(doctor.id);
        if (!setup.complete) return null;
        const profile = await this.profilesService.getDoctorProfile(doctor.id, {
          fullName: `Врач ${doctor.id.slice(0, 8)}`,
          specialty: doctor.specialization || 'Общая практика',
          verified: doctor.verified,
          experienceYears: doctor.experienceYears || 0
        });
        const casesCount = await this.casesRepo.count({ where: { doctorId: doctor.id } });
        return {
          id: doctor.id,
          fullName: profile.fullName,
          specialty: profile.specialty,
          experienceYears: doctor.experienceYears || 0,
          verified: doctor.verified,
          avatar: profile.avatar,
          pricePrimary: profile.pricePrimary || 15000,
          rating: profile.rating,
          reviewsCount: profile.reviewsCount,
          casesCount,
          reputationPoints: this.calculateReputationPoints(profile.rating, profile.reviewsCount, casesCount),
          headline: profile.headline,
          clinicName: profile.clinicName,
          catalogAudience: profile.catalogAudience,
          availability: profile.availability
        };
      })
    );
    return publicDoctors.filter((doctor): doctor is NonNullable<typeof doctor> => Boolean(doctor));
  }

  async listAll() {
    const list = await this.doctorsRepo.find({ order: { createdAt: 'DESC' } });
    return Promise.all(
      list.map(async (doctor) => {
        const profile = await this.profilesService.getDoctorProfile(doctor.id, {
          fullName: `Врач ${doctor.id.slice(0, 8)}`,
          specialty: doctor.specialization || 'Общая практика',
          verified: doctor.verified,
          experienceYears: doctor.experienceYears || 0
        });
        const casesCount = await this.casesRepo.count({ where: { doctorId: doctor.id } });
        return {
          id: doctor.id,
          fullName: profile.fullName,
          specialty: profile.specialty,
          specialization: profile.specialty,
          bio: profile.bio,
          headline: profile.headline,
          verified: doctor.verified,
          active: doctor.verified,
          experienceYears: doctor.experienceYears || 0,
          rating: profile.rating,
          reviewsCount: profile.reviewsCount,
          casesCount,
          reputationPoints: this.calculateReputationPoints(profile.rating, profile.reviewsCount, casesCount),
          pricePrimary: profile.pricePrimary,
          avatar: profile.avatar,
          city: profile.city,
          clinicName: profile.clinicName,
          catalogAudience: profile.catalogAudience,
          consultationModes: profile.consultationModes,
          availability: profile.availability
        };
      })
    );
  }

  async listForPartner(partnerUserId: string) {
    const organizationName = await this.getPartnerOrganizationName(partnerUserId);
    const list = await this.listAll();
    return list.filter((doctor) => {
      const clinicName = String(doctor.clinicName || '').trim().toLowerCase();
      if (!clinicName) return false;
      const normalizedPartnerClinic = organizationName.trim().toLowerCase();
      return (
        clinicName === normalizedPartnerClinic ||
        (normalizedPartnerClinic === DEFAULT_CLINIC_NAME.toLowerCase() &&
          clinicName === LEGACY_PARTNER_ORGANIZATION_NAME.toLowerCase())
      );
    });
  }

  async getDoctorProfile(doctorId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    const profile = await this.profilesService.getDoctorProfile(doctor.id, {
      fullName: 'Врач Takhet',
      specialty: doctor.specialization || 'Общая практика',
      verified: doctor.verified,
      experienceYears: doctor.experienceYears || 0
    });
    return { ...profile, createdAt: doctor.createdAt };
  }

  async getPublicDoctorProfile(doctorId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId, verified: true } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    const setup = await this.profilesService.getDoctorProfileSetupState(doctorId);
    if (!setup.complete) throw new NotFoundException('Doctor profile not found');
    return this.getDoctorProfile(doctorId);
  }

  async updateDoctorProfile(doctorId: string, bio: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    await this.profilesService.updateDoctorProfile(doctorId, { bio });
    await this.auditService.log('doctor.profile.updated.legacy', doctorId, { bio });
    return this.getDoctorProfile(doctor.id);
  }

  async createPartnerDoctor(
    fullName: string,
    specialty: string,
    partnerUserId?: string,
    options: { temporaryLogin?: string; temporaryPassword?: string; verified?: boolean } = {}
  ) {
    const doctorId = randomUUID();
    const credentials = await this.ensureDoctorUser(doctorId, fullName, {
      temporaryLogin: options.temporaryLogin,
      temporaryPassword: options.temporaryPassword
    });
    const created = await this.doctorsRepo.save(
      this.doctorsRepo.create({
        id: doctorId,
        specialization: specialty,
        licenseNumber: `PENDING-${Date.now()}`,
        experienceYears: options.verified ? 1 : 0,
        verified: options.verified || false
      })
    );

    if (partnerUserId) {
      const clinicName = await this.getPartnerOrganizationName(partnerUserId);
      await this.profilesService.updateDoctorProfile(created.id, {
        fullName,
        specialty,
        headline: 'Новый специалист Takhet+',
        focusAreas: [specialty],
        clinicName
      });
      await this.auditService.log('doctor.created', partnerUserId, { doctorId: created.id, fullName, specialty, clinicName });
    }

    return {
      id: created.id,
      fullName,
      specialty: created.specialization,
      active: created.verified,
      verified: created.verified,
      experienceYears: created.experienceYears || 0,
      temporaryLogin: credentials.temporaryLogin,
      temporaryPassword: credentials.temporaryPassword
    };
  }

  async createAdminDoctor(
    fullName: string,
    specialty: string,
    adminId: string,
    options: { catalogAudience?: CatalogAudience; temporaryLogin?: string } = {}
  ) {
    const catalogAudience = this.normalizeCatalogAudience(options.catalogAudience);
    const temporaryPassword = this.generateTemporaryPassword();
    const created = await this.createPartnerDoctor(fullName, specialty, undefined, {
      temporaryLogin: options.temporaryLogin,
      temporaryPassword,
      verified: true
    });
    await this.profilesService.updateDoctorProfile(created.id, {
      fullName,
      specialty,
      catalogAudience,
      bio: 'Профиль создан администратором Takhet+. Врач может уточнить описание, образование, опыт и расписание в настройках профиля.',
      headline: 'Специалист Takhet+',
      focusAreas: [specialty],
      education: ['Дипломированный специалист'],
      experienceYears: 1,
      pricePrimary: 15000,
      city: 'Almaty',
      clinicName: DEFAULT_CLINIC_NAME,
      availability: [
        { date: 'weekly:1', slots: ['09:00', '10:30', '14:00'] },
        { date: 'weekly:2', slots: ['09:00', '10:30', '14:00'] },
        { date: 'weekly:3', slots: ['09:00', '10:30', '14:00'] },
        { date: 'weekly:4', slots: ['09:00', '10:30', '14:00'] },
        { date: 'weekly:5', slots: ['09:00', '10:30', '14:00'] }
      ]
    });
    await this.auditService.log('doctor.created', adminId, { doctorId: created.id, fullName, specialty, catalogAudience });
    return {
      ...(await this.getDoctorProfile(created.id)),
      temporaryLogin: created.temporaryLogin,
      temporaryPassword: created.temporaryPassword,
      catalogAudience
    };
  }

  async approveDoctor(id: string, adminId: string, clinicName?: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.verified = true;
    const saved = await this.doctorsRepo.save(doctor);
    if (clinicName) {
      await this.profilesService.assignDoctorClinic(saved.id, clinicName);
    }
    await this.approvePortalApplicationForDoctor(saved.id);
    await this.auditService.log('doctor.approved', adminId, { doctorId: id });
    return this.getDoctorProfile(saved.id);
  }

  async setDoctorActive(id: string, active: boolean, actorId: string, clinicName?: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.verified = active;
    const saved = await this.doctorsRepo.save(doctor);
    if (active && clinicName) {
      await this.profilesService.assignDoctorClinic(saved.id, clinicName);
    }
    if (active) {
      await this.approvePortalApplicationForDoctor(saved.id);
    }
    await this.auditService.log('doctor.status.changed', actorId, { doctorId: id, active });
    return this.getDoctorProfile(saved.id);
  }

  async setPartnerDoctorActive(partnerUserId: string, id: string, active: boolean) {
    const doctor = await this.getDoctorProfile(id);
    const organizationName = await this.getPartnerOrganizationName(partnerUserId);
    if (String(doctor.clinicName || '').trim().toLowerCase() !== organizationName.trim().toLowerCase()) {
      throw new NotFoundException('Doctor not found');
    }
    return this.setDoctorActive(id, active, partnerUserId);
  }

  async deleteDoctor(id: string, actorId: string) {
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    await this.doctorsRepo.delete({ id });
    await this.auditService.log('doctor.deleted', actorId, { doctorId: id });
    return { success: true };
  }

  async getDoctorStats() {
    const total = await this.doctorsRepo.count();
    const active = await this.doctorsRepo.count({ where: { verified: true } });
    const pending = total - active;
    return { total, active, pending };
  }

  async resolvePortalDoctorId(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (user?.role !== 'doctor') return userId;

    const directDoctor = await this.doctorsRepo.findOne({ where: { id: userId } });
    if (directDoctor) {
      return directDoctor.id;
    }

    const activeDoctors = await this.listActive();
    if (activeDoctors.length === 1) return activeDoctors[0].id;

    return userId;
  }
  private async ensureDoctorUser(
    doctorId: string,
    fullName: string,
    options: { temporaryLogin?: string; temporaryPassword?: string } = {}
  ) {
    const existingUser = await this.usersRepo.findOne({ where: { id: doctorId } });
    if (existingUser) return { user: existingUser, temporaryLogin: existingUser.email, temporaryPassword: undefined };

    const emailSafeName = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 40) || 'doctor';

    const temporaryLogin = options.temporaryLogin?.trim() || `${emailSafeName}.${doctorId.slice(0, 8)}@takhet.local`;
    const temporaryPassword = options.temporaryPassword || 'managed-by-admin';
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        id: doctorId,
        email: temporaryLogin,
        passwordHash: this.hashPassword(temporaryPassword),
        role: 'doctor'
      })
    );
    return { user, temporaryLogin, temporaryPassword: options.temporaryPassword ? temporaryPassword : undefined };
  }

  private async approvePortalApplicationForDoctor(doctorId: string) {
    const user = await this.usersRepo.findOne({ where: { id: doctorId } });
    if (!user) return;
    await this.dataSource.query(`
      create table if not exists portal_applications (
        user_id uuid primary key references users(id) on delete cascade,
        email text not null,
        role text not null,
        status text not null default 'pending_admin_approval',
        source text not null default 'public_registration',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);
    await this.dataSource.query(
      `
        insert into portal_applications (user_id, email, role, status, source, updated_at)
        values ($1, $2, 'doctor', 'approved', 'admin_doctor_approval', now())
        on conflict (user_id)
        do update set email = excluded.email, role = 'doctor', status = 'approved', source = excluded.source, updated_at = now()
      `,
      [doctorId, user.email]
    );
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }

  private generateTemporaryPassword() {
    return `Takhet-${randomBytes(4).toString('hex')}`;
  }

  private normalizeCatalogAudience(value?: CatalogAudience) {
    return value === 'mental' || value === 'both' || value === 'doctor' ? value : 'doctor';
  }

  private calculateReputationPoints(rating: number, reviewsCount: number, casesCount: number) {
    return Math.round((rating || 0) * 100 + (reviewsCount || 0) * 5 + (casesCount || 0) * 2);
  }

  private async getPartnerOrganizationName(partnerUserId: string) {
    const profile = await this.profilesService.getPortalProfile(partnerUserId, 'partner');
    const organizationName = String(profile.organizationName || '').trim();
    if (!organizationName || organizationName === LEGACY_PARTNER_ORGANIZATION_NAME) {
      return DEFAULT_CLINIC_NAME;
    }
    return organizationName;
  }
}


