import { inject, Injectable, signal } from '@angular/core';
import type { Notification } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { entityRoute } from './entity-route';

export type NotificationsView = 'all' | 'unread' | 'archived';

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  readonly unread = signal(0);
  readonly items = signal<Notification[]>([]);
  readonly view = signal<NotificationsView>('all');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  /** The rows whose mutation is in flight, so the control that started it can wait. */
  readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly busyAll = signal(false);

  async refreshCount(): Promise<void> {
    const api = await this.backend.ready();
    const session = await api.session.get();
    this.unread.set(session.unreadNotifications);
  }

  async loadPage(page = 1, size = 25): Promise<void> {
    this.loading.set(true);
    try {
      const api = await this.backend.ready();
      const view = this.view();
      const r = await api.notifications.list({
        page,
        pageSize: size,
        sort: '-createdAt',
        includeArchived: view === 'archived',
        ...(view === 'unread' ? { filter: { read: 'false' } } : {}),
      });
      const rows = r.data.filter((n) =>
        view === 'archived' ? n.archivedAt !== undefined : n.archivedAt === undefined,
      );
      this.items.set(rows);
      this.page.set(r.page.number);
      this.total.set(view === 'archived' ? rows.length : r.page.totalItems);
    } finally {
      this.loading.set(false);
    }
  }

  private async after(): Promise<void> {
    await Promise.all([this.refreshCount(), this.loadPage(this.page())]);
  }

  markRead(id: string): Promise<void> {
    return this.mutate(id, async () => (await this.backend.ready()).notifications.markRead(id));
  }

  archive(id: string): Promise<void> {
    return this.mutate(id, async () => (await this.backend.ready()).notifications.archive(id));
  }

  async markAllRead(): Promise<void> {
    this.busyAll.set(true);
    try {
      await this.health.mutation(async () => (await this.backend.ready()).notifications.markAllRead());
      await this.after();
    } finally {
      this.busyAll.set(false);
    }
  }

  private async mutate(id: string, action: () => Promise<unknown>): Promise<void> {
    this.busy.update((set) => new Set(set).add(id));
    try {
      await this.health.mutation(action);
      await this.after();
    } finally {
      this.busy.update((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
  }

  /** The backend records what a notification is about, not where it lives; the route is the client's. */
  routeFor(notification: Notification): string | null {
    return entityRoute(notification.entityType, notification.entityId);
  }
}
