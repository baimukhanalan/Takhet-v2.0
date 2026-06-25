import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TriageModule } from './triage/triage.module';
import { CasesModule } from './cases/cases.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { FilesModule } from './files/files.module';
import { AuditModule } from './audit/audit.module';
import { SignatureModule } from './signatures/signature.module';
import { env } from './config/env.config';
import { DoctorModule } from './doctor/doctor.module';
import { PartnerModule } from './partner/partner.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PatientModule } from './patient/patient.module';
import { ProfilesModule } from './profiles/profiles.module';
import { CommunityModule } from './community/community.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { LabsModule } from './labs/labs.module';
import { GuestModule } from './guest/guest.module';
import { AcademyModule } from './academy/academy.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: env.rateLimitTtlMs,
        limit: env.rateLimitMax
      }
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TriageModule,
    CasesModule,
    DoctorsModule,
    PaymentsModule,
    AiModule,
    FilesModule,
    AuditModule,
    SignatureModule,
    NotificationsModule,
    ProfilesModule,
    CommunityModule,
    RealtimeModule,
    TelemetryModule,
    EnterpriseModule,
    LabsModule,
    AcademyModule,
    GuestModule,
    DoctorModule,
    PartnerModule,
    AdminModule,
    PatientModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
