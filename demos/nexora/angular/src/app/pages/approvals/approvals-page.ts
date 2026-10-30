import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderTabs,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';
import { SlToastService } from '@slotted/angular/toast';
import type { ApprovalListItem } from '@slotted/demo-nexora-backend';

import { ApprovalsQueueStore, type QueueView } from '../../core/sales/approvals-queue.store';
import { ApprovalPanel } from '../orders/approval-panel';
import { formatDate } from '../orders/order-labels';
import { ReasonDialog } from '../orders/reason-dialog';

/**
 * The approvals queue (§67): the work this persona can decide, oldest first,
 * each request carrying what it is about and why it stopped. A decision is
 * taken here without opening the record, and the record is one link away.
 */
@Component({
  selector: 'app-approvals-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderTabs,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlStack,
    SlTab,
    SlTabList,
    SlTabs,
    SlText,
    ApprovalPanel,
    ReasonDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .queue {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-4);
    }
    /* The marker column and the content beside it, as the timeline lays them out. */
    .step-shape {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--slotted-space-3);
      align-items: start;
    }
    .row-head {
      display: flex;
      flex-wrap: wrap;
      gap: var(--slotted-space-2) var(--slotted-space-3);
      align-items: baseline;
      justify-content: space-between;
    }
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Approvals</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              What is waiting on a decision, oldest first. Deciding here writes the same command the
              record's own page does.
            </p>
          </div>
        </div>
        <div slPageHeaderTabs>
          <div slTabs [value]="store.view()" (valueChange)="setView($event.value)">
            <div slTabList aria-label="Approval queues">
              <div slTab value="mine">Yours {{ mineCount() }}</div>
              <div slTab value="pending">Everything waiting</div>
              <div slTab value="decided">Decided</div>
            </div>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="queue">
          @if (store.failure(); as failure) {
            <div slInlineMessage [tone]="failure.kind === 'transport' ? 'danger' : 'warning'">
              <span slInlineMessageIcon></span>
              {{ failure.message }}
            </div>
          }

          <!--
            The wait is the card's own anatomy, not three bars: the header's
            two lines, the heading, the reasons, and one step of the chain with
            its marker. The decisions are absent — a control nobody can press
            yet is a control that lies — so the card grows downward when the
            answer lands, and nothing already drawn moves.
          -->
          @if (store.loading() && store.rows().length === 0) {
            <div slSkeletonRegion [messages]="{ label: 'Reading the queue' }" [loading]="true">
              <div class="queue">
                @for (card of [1, 2, 3]; track card) {
                  <div slCard>
                    <div slCardHeader>
                      <span class="row-head">
                        <span slInline [gap]="3">
                          <span slSkeleton shape="text" inlineSize="11rem"></span>
                          <span slSkeleton shape="text" inlineSize="7rem"></span>
                        </span>
                        <span slSkeleton shape="text" inlineSize="9rem"></span>
                      </span>
                    </div>
                    <div slCardBody>
                      <div slStack [gap]="5">
                        <div slStack [gap]="2">
                          <span slSkeleton shape="text" inlineSize="16rem"></span>
                          <span slSkeleton shape="text" inlineSize="13rem"></span>
                        </div>
                        <span class="step-shape">
                          <span slSkeleton shape="circle" size="sm"></span>
                          <span slStack [gap]="2">
                            <span slSkeleton shape="text" inlineSize="8rem"></span>
                            <span slSkeleton shape="text" inlineSize="6rem"></span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (store.error(); as error) {
            <div slResultState status="error" reach="section">
              <div slResultStateContent>
                <h2 slResultStateTitle>The queue could not be read</h2>
                <p slResultStateDescription>{{ error }}</p>
              </div>
              <div slResultStateActions>
                <button slButton type="button" (click)="store.reload()">Try again</button>
              </div>
            </div>
          } @else if (store.rows().length === 0) {
            <div slResultState status="empty" reach="section">
              <div slResultStateContent>
                <h2 slResultStateTitle>{{ emptyTitle() }}</h2>
                <p slResultStateDescription>{{ emptyWords() }}</p>
              </div>
              <div slResultStateActions>
                <a slButtonLink variant="outline" tone="secondary" routerLink="/sales/orders">
                  Open the orders
                </a>
              </div>
            </div>
          } @else {
            @for (row of store.rows(); track row.id) {
              <div slCard>
                <div slCardHeader>
                  <span class="row-head">
                    <span slInline [gap]="3">
                      <a slLink variant="neutral" [routerLink]="routeFor(row)">
                        {{ row.targetLabel }}
                      </a>
                      @if (row.customerName) {
                        <span slText size="sm" tone="muted">{{ row.customerName }}</span>
                      }
                    </span>
                    <span slInline [gap]="3">
                      <span slText size="sm" tone="muted">{{ asked(row) }}</span>
                      @if (row.actionable && row.status === 'pending') {
                        <span slBadge variant="soft" size="sm" tone="accent">Yours to decide</span>
                      }
                    </span>
                  </span>
                </div>
                <div slCardBody>
                  <app-approval-panel
                    [approval]="row"
                    [subject]="row.targetNumber"
                    [busy]="store.deciding() === row.id"
                    (decide)="decide(row, $event)"
                  />
                </div>
              </div>
            }
          }
        </div>
      </div>

      <app-reason-dialog
        [(open)]="rejectOpen"
        title="Reject this request"
        description="It goes back to whoever asked, with your words."
        label="Why is it rejected?"
        placeholder="The discount is three points past policy for this segment."
        confirmLabel="Reject"
        [busy]="store.deciding() !== null"
        (confirm)="decided('reject', $event)"
      />
      <app-reason-dialog
        [(open)]="changesOpen"
        title="Ask for changes"
        description="The record stays where it is and its owner is told what to change."
        label="What has to change?"
        placeholder="Bring the freight onto the order and resubmit."
        confirmLabel="Ask for changes"
        tone="warning"
        [busy]="store.deciding() !== null"
        (confirm)="decided('changes', $event)"
      />
    </div>
  `,
})
export class ApprovalsPage implements OnInit {
  readonly store = inject(ApprovalsQueueStore);
  private readonly toasts = inject(SlToastService);

  readonly rejectOpen = signal(false);
  readonly changesOpen = signal(false);
  private readonly chosen = signal<ApprovalListItem | null>(null);

  readonly mineCount = computed(() => {
    const count = this.store.mineCount();
    return this.store.view() === 'mine' && !this.store.loading() ? `(${count})` : '';
  });

  readonly emptyTitle = computed(() =>
    this.store.view() === 'decided' ? 'Nothing has been decided yet' : 'Nothing is waiting on you',
  );

  readonly emptyWords = computed(() =>
    this.store.view() === 'mine'
      ? 'Every request that needs your role has been decided. The other queues show what is waiting on someone else.'
      : this.store.view() === 'pending'
        ? 'No order or quote is held up by an approval right now.'
        : 'Decisions appear here as they are taken.',
  );

  ngOnInit(): void {
    void this.store.open();
  }

  setView(view: string | undefined): void {
    void this.store.setView((view ?? 'mine') as QueueView);
  }

  routeFor(row: ApprovalListItem): string {
    return row.targetType === 'sales_order'
      ? `/sales/orders/${row.targetId}`
      : row.targetType === 'quote'
        ? `/sales/quotes/${row.targetId}`
        : row.targetType === 'purchase_order'
          ? `/procurement/purchase-orders/${row.targetId}`
          : row.targetType === 'cycle_count'
            ? `/inventory/cycle-counts/${row.targetId}`
            : `/finance/invoices/${row.targetId}`;
  }

  asked(row: ApprovalListItem): string {
    return `${row.requestedByName} · ${formatDate(row.requestedAt)}`;
  }

  decide(row: ApprovalListItem, decision: 'approve' | 'reject' | 'changes'): void {
    this.chosen.set(row);
    if (decision === 'reject') this.rejectOpen.set(true);
    else if (decision === 'changes') this.changesOpen.set(true);
    else void this.decided('approve', '');
  }

  async decided(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<void> {
    const row = this.chosen();
    if (row === null) return;
    const done = await this.store.decide(row, decision, reason);
    if (!done) return;
    this.rejectOpen.set(false);
    this.changesOpen.set(false);
    this.toasts.show({
      title:
        decision === 'approve'
          ? `${row.targetNumber} approved`
          : decision === 'reject'
            ? `${row.targetNumber} rejected`
            : `Changes asked on ${row.targetNumber}`,
      tone: decision === 'approve' ? 'success' : 'warning',
    });
  }
}
