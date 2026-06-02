import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { LoginRole } from '../auth/auth.service';

export type RealtimeScope = 'patient' | 'doctor' | 'partner' | 'admin' | 'global';

export type RealtimeEvent = {
  scope: RealtimeScope;
  entity: string;
  userIds?: string[];
  roles?: LoginRole[];
  timestamp: number;
};

@Injectable()
export class RealtimeService {
  private readonly eventsSubject = new Subject<RealtimeEvent>();
  readonly events$ = this.eventsSubject.asObservable();

  publish(event: Omit<RealtimeEvent, 'timestamp'>) {
    this.eventsSubject.next({
      ...event,
      timestamp: Date.now()
    });
  }

  publishToUser(userId: string, scope: RealtimeScope, entity: string) {
    this.publish({ userIds: [userId], scope, entity });
  }

  publishToUsers(userIds: string[], scope: RealtimeScope, entity: string) {
    this.publish({ userIds, scope, entity });
  }

  publishToRole(role: LoginRole, scope: RealtimeScope, entity: string) {
    this.publish({ roles: [role], scope, entity });
  }

  publishToRoles(roles: LoginRole[], scope: RealtimeScope, entity: string) {
    this.publish({ roles, scope, entity });
  }

  publishPlatform(entity: string) {
    this.publish({ roles: ['patient', 'doctor', 'partner', 'admin'], scope: 'global', entity });
  }
}
