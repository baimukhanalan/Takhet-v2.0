import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');

assert(app.includes("path=\"/auth/confirm-email\""), 'App must route /auth/confirm-email');
assert(app.includes("path=\"/auth/reset-password\""), 'App must route /auth/reset-password');
assert(app.includes('AuthConfirmEmailPage'), 'App must lazy-load AuthConfirmEmailPage');
assert(app.includes('AuthResetPasswordPage'), 'App must lazy-load AuthResetPasswordPage');

const confirmPagePath = 'src/pages/AuthConfirmEmailPage.tsx';
const resetPagePath = 'src/pages/AuthResetPasswordPage.tsx';

assert(existsSync(resolve(process.cwd(), confirmPagePath)), 'AuthConfirmEmailPage must exist');
assert(existsSync(resolve(process.cwd(), resetPagePath)), 'AuthResetPasswordPage must exist');

const confirmPage = read(confirmPagePath);
const resetPage = read(resetPagePath);

assert(confirmPage.includes('goBackOrAuth'), 'AuthConfirmEmailPage back action must use previous page fallback');
assert(resetPage.includes('goBackOrAuth'), 'AuthResetPasswordPage back action must use previous page fallback');

for (const marker of [
  'confirmEmailVerification',
  'emailConfirmed',
  'Подтверждение почты',
  'Вернуться ко входу'
]) {
  assert(confirmPage.includes(marker), `AuthConfirmEmailPage must include ${marker}`);
}

for (const marker of [
  'resetPassword',
  'passwordResetCompleted',
  'Восстановление доступа',
  'Новый пароль',
  'Вернуться ко входу'
]) {
  assert(resetPage.includes(marker), `AuthResetPasswordPage must include ${marker}`);
}

for (const source of [confirmPage, resetPage]) {
  for (const marker of ['\u0420\u2019', '\u0420\u045f', '\u0421\u0403', '\u0432\u0402', '\u0432\u201a\u0451', '\ufffd\ufffd\ufffd\ufffd']) {
    assert(!source.includes(marker), `Auth email flow pages must not contain mojibake marker: ${marker}`);
  }
}

const collectionPath = resolve(process.cwd(), 'postman/Takhet Auth Email.postman_collection.json');
const environmentPath = resolve(process.cwd(), 'postman/Takhet Production.postman_environment.json');

assert(existsSync(collectionPath), 'Postman auth collection must exist');
assert(existsSync(environmentPath), 'Postman production environment template must exist');

const collection = readFileSync(collectionPath, 'utf8');
const environment = readFileSync(environmentPath, 'utf8');

for (const route of [
  '/auth/request-email-verification',
  '/auth/confirm-email-verification',
  '/auth/request-password-reset',
  '/auth/reset-password',
  '/auth/login'
]) {
  assert(collection.includes(route), `Postman collection must include ${route}`);
}

assert(environment.includes('api_base_url'), 'Postman environment must expose api_base_url placeholder');
assert(!collection.includes('re_WXwRGj7h'), 'Postman collection must not contain real Resend API key');
assert(!environment.includes('re_WXwRGj7h'), 'Postman environment must not contain real Resend API key');

console.log('Auth email frontend and Postman contract passed');
