import { Injectable } from '@nestjs/common';
import { freemem, loadavg, totalmem, uptime } from 'os';

type TelemetrySnapshot = {
  time: string;
  cpu: number;
  ram: number;
  reqs: number;
};

@Injectable()
export class TelemetryService {
  private readonly snapshots: TelemetrySnapshot[] = [];
  private readonly requestTimestamps: number[] = [];

  constructor() {
    this.captureSnapshot();
    const timer = setInterval(() => this.captureSnapshot(), 5 * 60 * 1000);
    timer.unref?.();
  }

  recordRequest(path?: string) {
    if (path?.startsWith('/realtime/stream')) {
      return;
    }

    const now = Date.now();
    this.requestTimestamps.push(now);
    this.compactRequests(now);
  }

  getSystemHealth() {
    const current = this.sampleNow();
    const history = [...this.snapshots];

    if (!history.length || history[history.length - 1].time !== current.time) {
      history.push(current);
    }

    return {
      current,
      history: history.slice(-12),
      uptimeSeconds: Math.round(uptime()),
      activeRequestsPerMinute: current.reqs,
      status: current.cpu < 85 && current.ram < 90 ? 'stable' : 'attention'
    };
  }

  private captureSnapshot() {
    const snapshot = this.sampleNow();
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 12) {
      this.snapshots.splice(0, this.snapshots.length - 12);
    }
  }

  private sampleNow(): TelemetrySnapshot {
    const now = Date.now();
    this.compactRequests(now);

    const cores = 4;
    const cpu = Math.max(0, Math.min(100, Math.round((loadavg()[0] / cores) * 100)));
    const ram = Math.max(0, Math.min(100, Math.round(((totalmem() - freemem()) / totalmem()) * 100)));
    const reqs = this.requestTimestamps.length;
    const time = new Date(now).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    return { time, cpu, ram, reqs };
  }

  private compactRequests(now: number) {
    const oneMinuteAgo = now - 60 * 1000;
    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] < oneMinuteAgo) {
      this.requestTimestamps.shift();
    }
  }
}
