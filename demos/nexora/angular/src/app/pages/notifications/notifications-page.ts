import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemActions,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemLabel,
  SlListItemStart,
} from '@slotted/angular/list-item';
import { SlMenuItem, SlMenuItemIcon } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTabs,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import type { Notification } from '@slotted/demo-nexora-backend';

import { NotificationsStore, type NotificationsView } from '../../core/activity/notifications.store';
import { NotificationRow } from '../../shell/notifications/notification-row';

@Component({
  selector: 'app-notifications-page',
  imports: [
    NgIcon,
    SlButton,
    SlIconButton,
    SlList,
    SlListItem,
    SlListItemActions,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemLabel,
    SlListItemStart,
    SlMenuItem,
    SlMenuItemIcon,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTabs,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
    SlResultState,
    SlResultStateContent,
    SlResultStateTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlTab,
    SlTabList,
    SlTabs,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
    NotificationRow,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* The pager stands at the end of the line, under the actions column it belongs with. */
    nav[slPagination] {
      justify-content: flex-end;
      margin-block-start: var(--slotted-space-4);
    }
  `,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Notifications</h1></div>
            <!-- In the compact class the toolbar keeps the action on the title row, or folds it into its menu. -->
            <div slPageHeaderActions>
              <div slToolbar aria-label="Notification actions" overflow="menu">
                <div slToolbarItem [slToolbarItemCounterpart]="markAllItem">
                  <button
                    slButton
                    variant="outline"
                    [disabled]="store.unread() === 0"
                    [loading]="store.busyAll()"
                    [messages]="{ loading: 'Marking all as read' }"
                    (click)="store.markAllRead()"
                  >
                    Mark all as read
                  </button>
                </div>
                <sl-toolbar-overflow />
              </div>
            </div>
          </div>
        </div>
        <!-- The views are the header's tabs: pinned under the title while the list scrolls. -->
        <div slPageHeaderTabs>
          <div slTabs [value]="store.view()" (valueChange)="setView($event.value)">
            <div slTabList aria-label="Views">
              <div slTab value="all">All</div>
              <div slTab value="unread">
                Unread
                @if (store.unread() > 0) {
                  ({{ store.unread() }})
                }
              </div>
              <div slTab value="archived">Archived</div>
            </div>
          </div>
        </div>
      </header>
      <div slPageBody>
        @if (store.items().length === 0 && store.loading()) {
          <!-- A view or a page on its way: the rows' own boxes, empty, so the wait is visible. -->
          <div slSkeletonRegion [messages]="{ label: 'Loading notifications' }" [loading]="true">
            <ul slList>
              @for (i of placeholders; track i) {
                <li slListItem>
                  <div slListItemContent>
                    <span slListItemStart><span slSkeleton shape="circle" size="sm"></span></span>
                    <div slListItemBody>
                      <span slListItemLabel><span slSkeleton shape="text" inlineSize="70%"></span></span>
                      <span slListItemDescription><span slSkeleton shape="text" inlineSize="90%"></span></span>
                    </div>
                  </div>
                </li>
              }
            </ul>
          </div>
        } @else if (store.items().length === 0) {
          <div slResultState status="empty" reach="section">
            <div slResultStateContent><h2 slResultStateTitle>Nothing here</h2></div>
          </div>
        } @else {
          <ul slList>
            @for (n of store.items(); track n.id) {
              <li slListItem [attr.data-unread]="n.readAt === undefined ? '' : null">
                <div
                  slListItemContent
                  appNotificationRow
                  [notification]="n"
                  (open)="open($event)"
                ></div>
  <!--
    Two glyphs with no words beside them: each names itself in a tooltip on
    hover, on keyboard focus and on a held touch, as the notification center
    in the bell's panel names its own. The accessible name carries the row's
    title; the tooltip says only the action.
  -->
  <div slListItemActions>
    @if (n.readAt === undefined) {
      <ng-container slTooltip openOn="hover" side="bottom">
        <button
          slIconButton
          slTooltipTrigger
          size="sm"
          tone="secondary"
          variant="ghost"
          [attr.aria-label]="'Mark as read: ' + n.title"
          [loading]="store.busy().has(n.id)"
          [messages]="{ loading: 'Marking as read' }"
          (click)="store.markRead(n.id)"
        >
          <ng-icon name="lucideCheck" />
        </button>
        <ng-template slTooltipLayer><div slTooltipContent>Mark as read</div></ng-template>
      </ng-container>
    }
    @if (!n.archivedAt) {
      <ng-container slTooltip openOn="hover" side="bottom">
        <button
          slIconButton
          slTooltipTrigger
          size="sm"
          tone="secondary"
          variant="ghost"
          [attr.aria-label]="'Archive: ' + n.title"
          [loading]="store.busy().has(n.id)"
          [messages]="{ loading: 'Archiving' }"
          (click)="store.archive(n.id)"
        >
          <ng-icon name="lucideArchive" />
        </button>
        <ng-template slTooltipLayer><div slTooltipContent>Archive</div></ng-template>
      </ng-container>
    }
  </div>
              </li>
            }
          </ul>
        }
        @if (store.total() > 0) {
          <nav
            slPagination
            [page]="store.page()"
            [count]="store.total()"
            [pageSize]="25"
            (pageChange)="goTo($event.value)"
            aria-label="Notifications pages"
          >
            <button slPaginationPrevious type="button"></button>
            <sl-pagination-items />
            <button slPaginationNext type="button"></button>
          </nav>
        }
      </div>
      <ng-template #markAllItem>
        <button
          slMenuItem
          type="button"
          [disabled]="store.unread() === 0"
          (click)="store.markAllRead()"
        >
          <ng-icon slMenuItemIcon name="lucideCheckCheck" />
          Mark all as read
        </button>
      </ng-template>
    </div>
  `,
})
export class NotificationsPage implements OnInit {
  readonly store = inject(NotificationsStore);
  private readonly router = inject(Router);

  readonly placeholders = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    void this.store.loadPage(1, 25);
  }

  /** A change of view or of page empties the list first: the rows on screen are the old answer. */
  setView(view: string | undefined): void {
    this.store.view.set((view ?? 'all') as NotificationsView);
    this.store.items.set([]);
    void this.store.loadPage(1, 25);
  }

  goTo(page: number): void {
    this.store.items.set([]);
    void this.store.loadPage(page, 25);
  }

  async open(n: Notification): Promise<void> {
    if (n.readAt === undefined) await this.store.markRead(n.id);
    const route = this.store.routeFor(n);
    if (route !== null) await this.router.navigateByUrl(route);
  }
}
