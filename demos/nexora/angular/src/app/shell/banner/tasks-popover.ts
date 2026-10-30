import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import {
  SlPopover,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlTopNavigationAction, SlTopNavigationCount } from '@slotted/angular/top-navigation';

import { entityRoute } from '../../core/activity/entity-route';
import { TasksStore } from '../../core/activity/tasks.store';
import { ClockService } from '../../core/session/clock.service';
import type { TaskListItem } from '@slotted/demo-nexora-backend';

@Component({
  selector: 'app-tasks-popover',
  imports: [
    NgIcon,
    RouterLink,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemLabel,
    SlPopover,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlSkeleton,
    SlSkeletonRegion,
    SlTopNavigationAction,
    SlTopNavigationCount,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .panel {
      inline-size: min(28rem, calc(100vw - 2rem));
    }
    .empty {
      margin: 0;
      padding: var(--slotted-space-4);
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    <ng-container slPopover size="lg" side="bottom" align="end" (openChangeRequest)="opened($event.value)">
      <button slTopNavigationAction slPopoverTrigger [label]="label()">
        <ng-icon name="lucideListTodo" />
        @if (store.open() > 0) {
          <span slTopNavigationCount>{{ store.open() }}</span>
        }
      </button>
      <ng-template slPopoverLayer>
        <div slPopoverContent class="panel">
          <div slPopoverHeader><div slPopoverTitle>Tasks</div></div>
          <div slPopoverBody>
            @if (store.items().length === 0 && store.loading()) {
              <!-- The first answer is on its way: the rows' own boxes, so the wait reads as a wait and not as nothing. -->
              <div slSkeletonRegion [messages]="{ label: 'Loading tasks' }" [loading]="true">
                <ul slList>
                  @for (i of placeholders; track i) {
                    <li slListItem size="sm">
                      <div slListItemContent>
                        <div slListItemBody>
                          <span slListItemLabel><span slSkeleton shape="text" inlineSize="60%"></span></span>
                          <span slListItemDescription><span slSkeleton shape="text" inlineSize="85%"></span></span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            } @else if (store.items().length === 0) {
              <p class="empty">No open tasks.</p>
            } @else {
              <ul slList [attr.aria-busy]="store.loading() ? 'true' : null">
                @for (t of store.items().slice(0, 6); track t.id) {
                  <li slListItem size="sm" [tone]="t.overdue ? 'danger' : undefined" [attr.data-task]="t.id">
                    <!-- A task about a record opens it: the work is done there (§70.4). -->
                    @if (routeOf(t); as route) {
                      <a slListItemContent [routerLink]="route">
                        <div slListItemBody>
                          <span slListItemLabel>{{ t.title }}</span>
                          <span slListItemDescription>{{ describe(t) }}</span>
                        </div>
                      </a>
                    } @else {
                      <div slListItemContent>
                        <div slListItemBody>
                          <span slListItemLabel>{{ t.title }}</span>
                          <span slListItemDescription>{{ describe(t) }}</span>
                        </div>
                      </div>
                    }
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </ng-template>
    </ng-container>
  `,
})
export class TasksPopover {
  readonly label = input.required<string>();
  readonly placeholders = [1, 2, 3];
  readonly store = inject(TasksStore);
  readonly clock = inject(ClockService);

  routeOf(task: TaskListItem): string | null {
    return entityRoute(task.relatedEntityType, task.relatedEntityId);
  }

  /** When it is due, how pressing, and who set it when it was not a person. */
  describe(task: TaskListItem): string {
    const due = task.dueDate ? `${task.overdue ? 'Overdue' : 'Due'} ${this.clock.formatDate(task.dueDate)} · ` : '';
    const from = task.createdBy === 'usr_system_automation' ? ' · from a workflow' : '';
    return `${due}${task.priority} priority${from}`;
  }

  opened(open: boolean): void {
    if (open) void this.store.refresh();
  }
}
