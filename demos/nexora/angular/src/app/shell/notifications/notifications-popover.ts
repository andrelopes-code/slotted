import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlLink } from '@slotted/angular/link';
import {
  SlNotificationCenter,
  SlNotificationCenterFooter,
  type NotificationCenterItemRequest,
  type NotificationCenterReadRequest,
  type NotificationCenterTone,
  type NotificationItem,
} from '@slotted/angular/notification-center';
import { SlPopover, SlPopoverContent, SlPopoverLayer, SlPopoverTrigger } from '@slotted/angular/popover';
import { SlTopNavigationCount, SlTopNavigationNotifications } from '@slotted/angular/top-navigation';
import type { Notification, NotificationType } from '@slotted/demo-nexora-backend';

import { NotificationsStore } from '../../core/activity/notifications.store';
import { ClockService } from '../../core/session/clock.service';

const TONE: Record<NotificationType, NotificationCenterTone> = {
  info: 'secondary',
  success: 'success',
  warning: 'warning',
  action_required: 'danger',
};

/** The bell, and the centre under it: the family's feed over the store's rows. */
@Component({
  selector: 'app-notifications-popover',
  imports: [
    RouterLink,
    SlLink,
    SlNotificationCenter,
    SlNotificationCenterFooter,
    SlPopover,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
    SlTopNavigationCount,
    SlTopNavigationNotifications,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * The centre contributes no intrinsic width (it is a query container), so
     * the popover would settle at the family's 22rem floor; the app states the
     * measure, which is the layer's cap less its own gap. The height is the
     * app's too: the feed scrolls inside it instead of running to the bottom
     * of the viewport.
     */
    .centre {
      inline-size: min(27rem, calc(100vw - var(--slotted-space-8)));
      max-block-size: 30rem;
    }
  `,
  template: `
    <ng-container
      slPopover
      size="lg"
      side="bottom"
      align="end"
      [(open)]="open"
      (openChangeRequest)="$event.value && load()"
    >
      <button slTopNavigationNotifications slPopoverTrigger [attr.aria-label]="label()">
        @if (store.unread() > 0) {
          <span slTopNavigationCount>{{ store.unread() }}</span>
        }
      </button>
      <ng-template slPopoverLayer>
        <div slPopoverContent aria-label="Notifications">
          <section
            slNotificationCenter
            class="centre"
            size="sm"
            level="3"
            [items]="items()"
            [count]="store.unread()"
            [now]="now()"
            [groupBy]="groupBy"
            [loading]="store.loading() && items().length === 0"
            (readRequest)="read($event)"
            (removeRequest)="archive($event)"
            (openRequest)="openItem($event)"
          >
            <div slNotificationCenterFooter>
              <a slLink routerLink="/notifications" (click)="open.set(false)">View all notifications</a>
            </div>
          </section>
        </div>
      </ng-template>
    </ng-container>
  `,
})
export class NotificationsPopover {
  readonly label = input.required<string>();
  readonly store = inject(NotificationsStore);
  readonly clock = inject(ClockService);
  private readonly router = inject(Router);
  readonly open = signal(false);

  /** The store's rows as the family's items; the row travels in `data` for the open request. */
  readonly items = computed<NotificationItem[]>(() =>
    this.store.items().map((n) => ({
      key: n.id,
      title: n.title,
      description: n.body,
      time: n.createdAt,
      read: n.readAt !== undefined,
      tone: TONE[n.type],
      data: n,
    })),
  );

  /** The demo clock's instant at the last open, so "2 hours ago" is measured from the business date. */
  readonly now = signal(Date.parse(this.clock.now()));

  readonly groupBy = (item: NotificationItem): string =>
    this.clock.isToday(item.time as string) ? 'Today' : 'Earlier';

  load(): void {
    this.now.set(Date.parse(this.clock.now()));
    this.store.view.set('all');
    void this.store.loadPage(1, 25);
  }

  /** The backend marks read only; a request to mark unread is refused. */
  async read(request: NotificationCenterReadRequest): Promise<void> {
    if (!request.read) {
      request.cancel();
      return;
    }
    const unread = this.items().filter((item) => !item.read).length;
    if (request.keys.length === unread && unread > 1) {
      await this.store.markAllRead();
      return;
    }
    for (const key of request.keys) await this.store.markRead(key);
  }

  archive(request: NotificationCenterItemRequest): Promise<void> {
    return this.store.archive(request.key);
  }

  async openItem(request: NotificationCenterItemRequest): Promise<void> {
    const n = this.items().find((item) => item.key === request.key)?.data as Notification | undefined;
    if (n === undefined) return;
    if (n.readAt === undefined) await this.store.markRead(n.id);
    this.open.set(false);
    const route = this.store.routeFor(n);
    if (route !== null) await this.router.navigateByUrl(route);
  }
}
