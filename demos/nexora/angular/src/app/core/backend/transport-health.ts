import { computed, inject, Injectable, signal } from '@angular/core';
import { SlToastService } from '@slotted/angular/toast';

import type { LatencyProfile } from '@slotted/demo-nexora-backend';

import { isApiError } from './api-error';

const WINDOW_MS = 60_000;

/** Degraded when the demo says so, or when something answered 503 in the last minute. */
@Injectable({ providedIn: 'root' })
export class TransportHealth {
  private readonly toasts = inject(SlToastService);
  private readonly lastFailure = signal<number | null>(null);
  private readonly tick = signal(0);
  /** The profile the demo panel chose; written by `DemoStore`. */
  readonly profile = signal<LatencyProfile>('normal');

  readonly degraded = computed(() => {
    this.tick();
    const last = this.lastFailure();
    return (
      this.profile() === 'degraded' ||
      (last !== null && performance.now() - last < WINDOW_MS)
    );
  });

  reportFailure(): void {
    this.lastFailure.set(performance.now());
    setTimeout(() => this.tick.update((n) => n + 1), WINDOW_MS + 50);
  }

  /**
   * Runs a mutation; a retryable 503 is reported, told to the reader, and
   * rethrown so the caller keeps its own state. The toast carries no Retry:
   * the beta's `ToastContent.actions` wants a template, not a handler.
   */
  async mutation<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) {
        this.reportFailure();
        this.toasts.show({
          title: 'Nexora did not answer',
          description: 'The change was not saved. Try again in a moment.',
          tone: 'danger',
          duration: 8000,
        });
      }
      throw error;
    }
  }

  /** Runs a read; a 503 is reported and swallowed into `fallback`. */
  async read<T>(action: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) {
        this.reportFailure();
        return fallback;
      }
      throw error;
    }
  }
}
