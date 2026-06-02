import { config } from 'dotenv';
import { randomBytes } from 'crypto';
config();

const runtimeJwtFallback = randomBytes(32).toString('hex');

export const env = {
  port: Number(process.env.PORT || 3000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:4174',
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseProjectId: process.env.SUPABASE_PROJECT_ID || 'lnwikszedzkxbavexcom',
  supabaseStorageHostname: process.env.SUPABASE_STORAGE_HOSTNAME || 'https://lnwikszedzkxbavexcom.storage.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'kaspi',
  kaspiMerchantId: process.env.KASPI_MERCHANT_ID || '',
  kaspiSecretKey: process.env.KASPI_SECRET_KEY || '',
  kaspiApiUrl: process.env.KASPI_API_URL || 'https://kaspi.kz/pay/api',
  paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL || '',
  paymentCancelUrl: process.env.PAYMENT_CANCEL_URL || '',
  appAdminEmail: process.env.APP_ADMIN_EMAIL || '',
  appAdminPassword: process.env.APP_ADMIN_PASSWORD || '',
  appDoctorEmail: process.env.APP_DOCTOR_EMAIL || '',
  appDoctorPassword: process.env.APP_DOCTOR_PASSWORD || '',
  appPartnerEmail: process.env.APP_PARTNER_EMAIL || '',
  appPartnerPassword: process.env.APP_PARTNER_PASSWORD || '',
  appPatientEmail: process.env.APP_PATIENT_EMAIL || '',
  appPatientPassword: process.env.APP_PATIENT_PASSWORD || '',
  feedbackEmailRecipient: process.env.FEEDBACK_EMAIL_RECIPIENT || 'baimukhanalan1@gmail.com',
  feedbackEmailWebhookUrl: process.env.FEEDBACK_EMAIL_WEBHOOK_URL || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  authEmailFrom: process.env.AUTH_EMAIL_FROM || 'Takhet+ <auth@takhet.com>',
  smsProvider: process.env.SMS_PROVIDER || 'none',
  smsApiKey: process.env.SMS_API_KEY || '',
  smsSender: process.env.SMS_SENDER || 'Takhet',
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  googleOAuthRedirectUrl: process.env.GOOGLE_OAUTH_REDIRECT_URL || '',
  piiEncryptionKey: process.env.PII_ENCRYPTION_KEY || '',
  geminiFlashModel: process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash',
  geminiProModel: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro',
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite',
  appJwtSecret: process.env.APP_JWT_SECRET || runtimeJwtFallback,
  rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 30)
};
