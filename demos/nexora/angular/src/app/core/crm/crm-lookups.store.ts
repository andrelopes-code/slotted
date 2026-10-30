import { inject, Injectable, signal } from '@angular/core';
import type { PriceList, Team, UserListItem } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';

export type PriceListOption = PriceList & { entryCount: number };
export type TeamOption = Team & { memberCount: number; leadName?: string };

/**
 * The lists a CRM form chooses from. Each read is a permission the persona may
 * not hold: `GET /users` needs `users.view` and `GET /teams` needs
 * `teams.view`, which neither a Sales Manager nor a Sales Representative has.
 * A list that stays empty is a field the form does not offer, not a field that
 * offers nothing.
 */
@Injectable({ providedIn: 'root' })
export class CrmLookupsStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly session = inject(SessionStore);
  private readonly health = inject(TransportHealth);

  readonly priceLists = signal<readonly PriceListOption[]>([]);
  readonly users = signal<readonly UserListItem[]>([]);
  readonly teams = signal<readonly TeamOption[]>([]);
  readonly loading = signal(false);

  private loaded = false;

  /** Read once per session; the lists are a tenant's configuration, not a query. */
  async load(): Promise<void> {
    if (this.loaded || this.loading()) return;
    this.loading.set(true);
    try {
      const api = await this.backend.ready();
      const [priceLists, users, teams] = await Promise.all([
        this.read(() => api.catalog.priceLists(), 'pricing.view', []),
        this.read(
          async () => (await api.identity.users({ pageSize: 100 })).data,
          'users.view',
          [] as UserListItem[],
        ),
        this.read(() => api.identity.teams(), 'teams.view', [] as TeamOption[]),
      ]);
      this.priceLists.set(priceLists);
      this.users.set(users.filter((user) => user.status === 'active'));
      this.teams.set(teams);
      this.loaded = true;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * A list the persona may not read, or that the transport did not answer, is
   * an empty list: the form offers no choice rather than an error of its own.
   */
  private async read<T>(action: () => Promise<T>, permission: string, empty: T): Promise<T> {
    if (!this.session.can(permission)) return empty;
    try {
      return await this.health.read(action, empty);
    } catch {
      return empty;
    }
  }

  /** The active lists of a region, in the currency the region bills in. */
  priceListsFor(regionCode: string): readonly PriceListOption[] {
    return this.priceLists().filter(
      (list) => list.regionCode === regionCode && list.status === 'active',
    );
  }

  reset(): void {
    this.loaded = false;
    this.priceLists.set([]);
    this.users.set([]);
    this.teams.set([]);
  }
}
