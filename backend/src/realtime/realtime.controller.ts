import { Controller, MessageEvent, Req, Sse, UseGuards } from '@nestjs/common';
import { interval, merge, Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthGuard } from '../auth/auth.guard';
import { RealtimeEvent, RealtimeService } from './realtime.service';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('stream')
  @UseGuards(AuthGuard)
  stream(@Req() req: any): Observable<MessageEvent> {
    const user = req.user as { id: string; role: string };

    return merge(
      of({
        type: 'connected',
        data: {
          status: 'ok',
          role: user.role,
          timestamp: Date.now()
        }
      }),
      interval(25000).pipe(
        map(() => ({
          type: 'heartbeat',
          data: { timestamp: Date.now() }
        }))
      ),
      this.realtimeService.events$.pipe(
        filter((event) => this.canReceive(user.id, user.role, event)),
        map((event) => ({
          type: 'change',
          data: {
            scope: event.scope,
            entity: event.entity,
            timestamp: event.timestamp
          }
        }))
      )
    );
  }

  private canReceive(userId: string, role: string, event: RealtimeEvent) {
    const roleAllowed = !event.roles || event.roles.includes(role as any);
    const userAllowed = !event.userIds || event.userIds.includes(userId);
    return roleAllowed || userAllowed;
  }
}
