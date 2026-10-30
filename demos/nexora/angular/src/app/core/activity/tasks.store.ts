import { inject, Injectable, signal } from '@angular/core';
import type { TaskListItem } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';

@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly backend = inject(NEXORA_BACKEND);
  readonly open = signal(0);
  readonly items = signal<TaskListItem[]>([]);
  readonly loading = signal(false);

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const api = await this.backend.ready();
      const r = await api.tasks.list({
        mine: true,
        filter: { status: 'open' },
        sort: 'dueDate',
        pageSize: 25,
      });
      this.items.set(r.data);
      this.open.set(r.page.totalItems);
    } finally {
      this.loading.set(false);
    }
  }
}
