import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButtonLink } from '@slotted/angular/button';
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
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlTopNavigationAction, SlTopNavigationCount } from '@slotted/angular/top-navigation';

import { ApprovalsStore } from '../../core/activity/approvals.store';
import { ClockService } from '../../core/session/clock.service';

@Component({
  selector: 'app-approvals-popover',
  imports: [
    CurrencyPipe,
    RouterLink,
    NgIcon,
    SlButtonLink,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemLabel,
    SlPopover,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverFooter,
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
        <ng-icon name="lucideClipboardCheck" />
        @if (store.pending() > 0) {
          <span slTopNavigationCount>{{ store.pending() }}</span>
        }
      </button>
      <ng-template slPopoverLayer>
        <div slPopoverContent class="panel">
          <div slPopoverHeader><div slPopoverTitle>Approvals</div></div>
          <div slPopoverBody>
            @if (store.items().length === 0 && store.loading()) {
              <!-- The first answer is on its way: the rows' own boxes, so the wait reads as a wait and not as nothing. -->
              <div slSkeletonRegion [messages]="{ label: 'Loading approvals' }" [loading]="true">
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
              <p class="empty">Nothing waiting for you.</p>
            } @else {
              <ul slList [attr.aria-busy]="store.loading() ? 'true' : null">
                @for (a of store.items().slice(0, 6); track a.id) {
                  <li slListItem size="sm">
                    <div slListItemContent>
                      <div slListItemBody>
                        <span slListItemLabel>{{ a.targetNumber }} · {{ a.targetLabel }}</span>
                        <span slListItemDescription>
                          @if (a.amount) {
                            {{ a.amount.minor / 100 | currency: a.amount.currency }} ·
                          }
                          {{ a.reasons.join(', ') }} · {{ clock.relative(a.metadata.createdAt) }}
                        </span>
                      </div>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
          <div slPopoverFooter>
            <a slButtonLink routerLink="/sales/approvals" size="sm" variant="ghost">
              Open approval queue
            </a>
          </div>
        </div>
      </ng-template>
    </ng-container>
  `,
})
export class ApprovalsPopover {
  readonly label = input.required<string>();
  readonly placeholders = [1, 2, 3];
  readonly store = inject(ApprovalsStore);
  readonly clock = inject(ClockService);

  opened(open: boolean): void {
    if (open) void this.store.load();
  }
}
