import { inject, Injectable, signal } from '@angular/core';
import type { ApprovalListItem } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';

@Injectable({ providedIn: 'root' })
export class ApprovalsStore {
  private readonly backend = inject(NEXORA_BACKEND);
  readonly pending = signal(0);
  readonly items = signal<ApprovalListItem[]>([]);
  readonly loading = signal(false);

  /**
   * The count the shell shows is the count the queue shows: both are the
   * requests whose current step this persona may decide. `GET /session`
   * counts any pending step of the request and ignores the rule that a
   * requester never decides their own, so it answers a larger number — see
   * the ledger row "two rules for one approvals count".
   */
  async refresh(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const api = await this.backend.ready();
      // 100 is the largest page the backend takes (§73.3); a tenant past that
      // many pending approvals would need a count of its own.
      const r = await api.approvals.list({ filter: { status: 'pending' }, pageSize: 100 });
      this.items.set(r.data.filter((a) => a.actionable));
      this.pending.set(this.items().length);
    } finally {
      this.loading.set(false);
    }
  }
}
