import { config } from 'dotenv';
import { randomBytes } from 'crypto';
config();

const runtimeJwtFallback = randomBytes(32).toString('hex');
const weakSecretValues = new Set([
  'replace-with-strong-secret',
  'replace-with-supabase-service-role-key',
  'replace-with-supabase-jwt-secret',
  'replace-with-gemini-api-key',
  'replace-with-admin-password',
  'replace-with-doctor-password',
  'replace-with-partner-password',
  'replace-with-patient-password',
  'replace-with-demo-password',
  'replace-with-32-byte-encryption-key',
  'replace-with-kaspi-secret-key',
  'your-secret',
  'your-secret-key',
  'your-service-role-key',
  'your-jwt-secret',
  'your-gemini-key',
  'secret',
  'password',
  'changeme',
  'change-me'
]);

const isWeakSecret = (value: string | undefined, minLength = 32) => {
  const normalized = (value || '').trim();
  return !normalized || normalized.length < minLength || weakSecretValues.has(normalized.toLowerCase());
};

const assertProductionRequiredSecret = (name: string, value: string | undefined, minLength = 32) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (isWeakSecret(value, minLength)) {
    throw new Error(`${name} must be set to a strong non-placeholder value in production`);
  }
};

const demoPortalLoginEnabled = process.env.ENABLE_DEMO_PORTAL_LOGIN === 'true' && process.env.NODE_ENV !== 'production';
const demoPortalEmail = process.env.DEMO_PORTAL_EMAIL || '';
const demoPortalPassword = process.env.DEMO_PORTAL_PASSWORD || '';

if (demoPortalLoginEnabled) {
  if (!demoPortalEmail.trim() || !demoPortalPassword.trim() || isWeakSecret(demoPortalPassword, 10)) {
    throw new Error('DEMO_PORTAL_EMAIL and a non-placeholder DEMO_PORTAL_PASSWORD are required when ENABLE_DEMO_PORTAL_LOGIN=true');
  }
}

const activeDemoPortalEmail = demoPortalLoginEnabled ? demoPortalEmail : '';
const activeDemoPortalPassword = demoPortalLoginEnabled ? demoPortalPassword : '';

const deriveSupabaseStorageHostname = () => {
  const explicit = process.env.SUPABASE_STORAGE_HOSTNAME || '';
  if (explicit) return explicit;

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  if (!supabaseUrl) return '';

  try {
    const url = new URL(supabaseUrl);
    if (url.hostname.endsWith('.supabase.co') && !url.hostname.includes('.storage.')) {
      url.hostname = url.hostname.replace('.supabase.co', '.storage.supabase.co');
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
};

assertProductionRequiredSecret('DATABASE_URL', process.env.DATABASE_URL, 12);
assertProductionRequiredSecret('APP_JWT_SECRET', process.env.APP_JWT_SECRET, 32);
assertProductionRequiredSecret('PII_ENCRYPTION_KEY', process.env.PII_ENCRYPTION_KEY, 32);
assertProductionRequiredSecret('SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY, 32);
assertProductionRequiredSecret('SUPABASE_JWT_SECRET', process.env.SUPABASE_JWT_SECRET, 32);
assertProductionRequiredSecret('GEMINI_API_KEY', process.env.GEMINI_API_KEY, 20);

if ((process.env.PAYMENT_PROVIDER || 'kaspi') === 'kaspi') {
  assertProductionRequiredSecret('KASPI_SECRET_KEY', process.env.KASPI_SECRET_KEY, 20);
}

export const env = {
  port: Number(process.env.PORT || 3000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:4174',
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseProjectId: process.env.SUPABASE_PROJECT_ID || '',
  supabaseStorageHostname: deriveSupabaseStorageHostname(),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'kaspi',
  kaspiMerchantId: process.env.KASPI_MERCHANT_ID || '',
  kaspiSecretKey: process.env.KASPI_SECRET_KEY || '',
  kaspiApiUrl: process.env.KASPI_API_URL || 'https://kaspi.kz/pay/api',
  paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL || '',
  paymentCancelUrl: process.env.PAYMENT_CANCEL_URL || '',
  appAdminEmail: process.env.APP_ADMIN_EMAIL || activeDemoPortalEmail,
  appAdminPassword: process.env.APP_ADMIN_PASSWORD || activeDemoPortalPassword,
  appDoctorEmail: process.env.APP_DOCTOR_EMAIL || activeDemoPortalEmail,
  appDoctorPassword: process.env.APP_DOCTOR_PASSWORD || activeDemoPortalPassword,
  appPartnerEmail: process.env.APP_PARTNER_EMAIL || activeDemoPortalEmail,
  appPartnerPassword: process.env.APP_PARTNER_PASSWORD || activeDemoPortalPassword,
  appPatientEmail: process.env.APP_PATIENT_EMAIL || activeDemoPortalEmail,
  appPatientPassword: process.env.APP_PATIENT_PASSWORD || activeDemoPortalPassword,
  demoPortalEmail: activeDemoPortalEmail,
  demoPortalPassword: activeDemoPortalPassword,
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
  geminiLiveModel: process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview',
  appJwtSecret: process.env.APP_JWT_SECRET || runtimeJwtFallback,
  rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 30)
};
