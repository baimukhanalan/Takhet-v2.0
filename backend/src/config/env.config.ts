import { config } from 'dotenv';
import { randomBytes } from 'crypto';
config();

const runtimeJwtFallback = randomBytes(32).toString('hex');
const weakSecretValues = new Set([
  'replace-with-strong-secret',
  'your-secret',
  'your-secret-key',
  'secret',
  'password',
  'changeme',
  'change-me'
]);

const assertProductionRequiredSecret = (name: string, value: string | undefined, minLength = 32) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const normalized = (value || '').trim();
  if (!normalized || normalized.length < minLength || weakSecretValues.has(normalized.toLowerCase())) {
    throw new Error(`${name} must be set to a strong non-placeholder value in production`);
  }
};

const demoPortalLoginEnabled = process.env.ENABLE_DEMO_PORTAL_LOGIN === 'true' && process.env.NODE_ENV !== 'production';
const demoPortalCredential = demoPortalLoginEnabled ? 'baimukhanalan1@gmail.com' : '';

assertProductionRequiredSecret('DATABASE_URL', process.env.DATABASE_URL, 12);
assertProductionRequiredSecret('APP_JWT_SECRET', process.env.APP_JWT_SECRET, 32);
assertProductionRequiredSecret('PII_ENCRYPTION_KEY', process.env.PII_ENCRYPTION_KEY, 32);

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
  appAdminEmail: process.env.APP_ADMIN_EMAIL || demoPortalCredential,
  appAdminPassword: process.env.APP_ADMIN_PASSWORD || demoPortalCredential,
  appDoctorEmail: process.env.APP_DOCTOR_EMAIL || demoPortalCredential,
  appDoctorPassword: process.env.APP_DOCTOR_PASSWORD || demoPortalCredential,
  appPartnerEmail: process.env.APP_PARTNER_EMAIL || demoPortalCredential,
  appPartnerPassword: process.env.APP_PARTNER_PASSWORD || demoPortalCredential,
  appPatientEmail: process.env.APP_PATIENT_EMAIL || demoPortalCredential,
  appPatientPassword: process.env.APP_PATIENT_PASSWORD || demoPortalCredential,
  feedbackEmailRecipient: process.env.FEEDBACK_EMAIL_RECIPIENT || 'takhetplus@gmail.com',
  feedbackEmailWebhookUrl: process.env.FEEDBACK_EMAIL_WEBHOOK_URL || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  authEmailFrom: process.env.AUTH_EMAIL_FROM || 'Takhet+ <auth@takhet.com>',
  smsProvider: process.env.SMS_PROVIDER || 'none',
  smsApiKey: process.env.SMS_API_KEY || '',
  smsApiUrl: process.env.SMS_API_URL || '',
  smsSender: process.env.SMS_SENDER || 'Takhet',
  turnIceServersJson: process.env.TURN_ICE_SERVERS_JSON || '',
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  googleOAuthRedirectUrl: process.env.GOOGLE_OAUTH_REDIRECT_URL || '',
  enableDemoPortalLogin: demoPortalLoginEnabled,
  piiEncryptionKey: process.env.PII_ENCRYPTION_KEY || '',
  geminiFlashModel: process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash',
  geminiProModel: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro',
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite',
  appJwtSecret: process.env.APP_JWT_SECRET || runtimeJwtFallback,
  rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 30)
};
