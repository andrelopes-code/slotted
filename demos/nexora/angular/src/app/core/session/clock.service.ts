import { inject, Injectable } from '@angular/core';

import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly sessionStore = inject(SessionStore);

  private timezone(): string {
    return this.sessionStore.session()?.organization.timezone ?? 'America/Chicago';
  }

  /** The demo instant plus the time elapsed since the session was loaded. */
  now(): string {
    const session = this.sessionStore.session();
    if (session === null) return new Date(0).toISOString();
    const elapsed = performance.now() - this.sessionStore.loadedAt();
    return new Date(new Date(session.demo.demoClock).getTime() + elapsed).toISOString();
  }

  businessDate(): string {
    return this.sessionStore.session()?.demo.today ?? '';
  }

  relative(instant: string): string {
    const diff = new Date(instant).getTime() - new Date(this.now()).getTime();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (abs < minute) return 'just now';
    if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute');
    if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
    if (abs < 30 * day) return rtf.format(Math.round(diff / day), 'day');
    return this.formatDate(instant);
  }

  formatDate(
    value: string,
    options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  ): string {
    return new Intl.DateTimeFormat('en-US', { timeZone: this.timezone(), ...options }).format(
      new Date(value),
    );
  }

  formatTime(instant: string): string {
    return this.formatDate(instant, { hour: 'numeric', minute: '2-digit' });
  }

  isToday(instant: string): boolean {
    return this.formatDate(instant) === this.formatDate(this.now());
  }
}
