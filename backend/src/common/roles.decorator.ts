import { SetMetadata } from '@nestjs/common';
import { LoginRole } from '../auth/auth.service';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: LoginRole[]) => SetMetadata(ROLES_KEY, roles);
