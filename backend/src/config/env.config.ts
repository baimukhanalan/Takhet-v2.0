import { config } from 'dotenv';
config();

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  kaspiMerchantId: process.env.KASPI_MERCHANT_ID || '',
  kaspiSecretKey: process.env.KASPI_SECRET_KEY || '',
  kaspiApiUrl: process.env.KASPI_API_URL || 'https://kaspi.kz/pay/api',
  appAdminEmail: process.env.APP_ADMIN_EMAIL || 'baimukhanalan1@gmail.com',
  appAdminPassword: process.env.APP_ADMIN_PASSWORD || 'baimukhanalan1@gmail.com',
  appDoctorEmail: process.env.APP_DOCTOR_EMAIL || 'doctor@takhet.local',
  appDoctorPassword: process.env.APP_DOCTOR_PASSWORD || 'doctor_password',
  appPartnerEmail: process.env.APP_PARTNER_EMAIL || 'partner@takhet.local',
  appPartnerPassword: process.env.APP_PARTNER_PASSWORD || 'partner_password',
  appPatientEmail: process.env.APP_PATIENT_EMAIL || 'patient@takhet.local',
  appPatientPassword: process.env.APP_PATIENT_PASSWORD || 'patient_password',
  appJwtSecret: process.env.APP_JWT_SECRET || 'takhet-dev-jwt-secret',
  rtcApiKey: process.env.RTC_API_KEY || '',
  rtcApiSecret: process.env.RTC_API_SECRET || '',
  rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 30)
};
