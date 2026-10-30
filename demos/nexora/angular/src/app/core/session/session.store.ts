import { computed, inject, Injectable, signal } from '@angular/core';
import type { SessionInfo, Warehouse } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { readDemoState, writeDemoState } from '../backend/demo-state';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly _session = signal<SessionInfo | null>(null);
  private readonly _status = signal<SessionStatus>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _warehouses = signal<Warehouse[]>([]);

  readonly session = this._session.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly warehouses = this._warehouses.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly loadedAt = signal(0);

  async load(): Promise<void> {
    if (readDemoState().signedOut === true) {
      this._session.set(null);
      this._status.set('unauthenticated');
      return;
    }
    this._status.set('loading');
    this._error.set(null);
    try {
      const api = await this.backend.ready();
      const session = await api.session.get();
      const all = session.permissions.includes('inventory.view')
        ? await api.inventory.warehouses()
        : [];
      const ids = session.warehouseIds;
      this._warehouses.set(ids === 'all' ? all : all.filter((w) => ids.includes(w.id)));
      this._session.set(session);
      this.loadedAt.set(performance.now());
      this._status.set('ready');
    } catch (error) {
      this._error.set(isApiError(error) ? error.message : 'Nexora is unavailable');
      this._status.set('error');
    }
  }

  reload(): Promise<void> {
    return this.load();
  }

  signOut(): void {
    writeDemoState({ signedOut: true });
    this._session.set(null);
    this._status.set('unauthenticated');
  }

  can(permission: string): boolean {
    return this._session()?.permissions.includes(permission) ?? false;
  }

  canAny(...permissions: string[]): boolean {
    return permissions.some((p) => this.can(p));
  }
}
