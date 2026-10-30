import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlField, SlFieldError } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderBack,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderSubheading,
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
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSkeleton, SlSkeletonRegion, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';

import { formatDate, formatMoney, formatQuantity } from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import { CycleCountStore, type CountLineRow } from '../../core/inventory/cycle-count.store';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import {
  COUNT_APPROVAL_MINOR,
  CYCLE_COUNT_STATUS_LABEL,
  CYCLE_COUNT_STATUS_TONE,
  CYCLE_COUNTS_ROUTE,
  milli,
  MOVEMENTS_ROUTE,
  positionLink,
  signed,
} from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { ApprovalPanel } from '../orders/approval-panel';
import { ReasonDialog } from '../orders/reason-dialog';
import { RecordProgress } from '../record-progress/record-progress';
import { ConfirmDialog } from './confirm-dialog';
import { countSentence, countSteps } from './inventory-progress';
import { leaveForm } from './leave-form';

/**
 * One cycle count (§62): where it stands, the lines with the snapshot `start`
 * took, the count the reader types, the variance it gives and — above
 * US$2,500 at standard cost — the approval the submission waits on, drawn by
 * `app-approval-panel` as the order's is.
 *
 * A count waiting on its approval offers no Complete: the backend completes
 * it when the approval is decided, and `complete` answers APPROVAL_REQUIRED
 * until then, so the step says whom it waits on instead (RP-09). A count
 * submitted without an approval offers it.
 */

@Component({
  selector: 'app-cycle-count-page',
  imports: [
    NgIcon,
    ApprovalPanel,
    ConfirmDialog,
    ReasonDialog,
    RecordProgress,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlIconButton,
    SlField,
    SlFieldError,
    SlForm,
    SlFormActions,
    SlGrid,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlMenuItem,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderBack,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlSkeletonText,
    SlStack,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardValue,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTag,
    SlTagBody,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .body {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* On a finger a record's link in a table row is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
    .down {
      color: var(--slotted-tone-danger-text);
    }
    .up {
      color: var(--slotted-tone-success-text);
    }
    .steps-shape {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--slotted-space-2);
    }
  `,
  template: `
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="countsRoute">Cycle counts</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Cycle count</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="missingStatus(error.code)"
            reach="section"
            data-testid="count-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ missingTitle(error.code) }}</h2>
              <p slResultStateDescription>
                {{
                  error.code === 'FORBIDDEN'
                    ? 'It counts a warehouse your role is not scoped to.'
                    : error.message
                }}
              </p>
            </div>
            <div slResultStateActions>
              @if (missingStatus(error.code) === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="countsRoute"
                >Back to counts</a
              >
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.count() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="countsRoute">Cycle counts</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ count()?.cycleCountNumber ?? 'Cycle count' }}</h1>
                @if (count(); as c) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()"
                      ><span slTagBody>{{ statusWord() }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every record carries its status: the mark keeps a small tag's box, on its own line on a phone as when loaded. -->
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="4rem"></span></span></span
                  ></span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="50%"></span>
                  </p>
                }
              </div>
              @if (count()) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Count actions" overflow="menu">
                    @if (actions().includes('start')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="startItem">
                        <button
                          slButton
                          type="button"
                          data-testid="start-count"
                          [loading]="store.busy() === 'start'"
                          [messages]="{ loading: 'Starting' }"
                          (click)="start()"
                        >
                          Start counting
                        </button>
                      </div>
                    }
                    @if (actions().includes('count')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="countItem">
                        <a
                          slButtonLink
                          data-testid="enter-count"
                          [routerLink]="[]"
                          [queryParams]="{ count: 1 }"
                          >Enter the count</a
                        >
                      </div>
                    }
                    @if (actions().includes('complete')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="completeItem">
                        <button
                          slButton
                          type="button"
                          data-testid="complete-count"
                          [loading]="store.busy() === 'complete'"
                          [messages]="{ loading: 'Completing' }"
                          (click)="complete()"
                        >
                          Complete the count
                        </button>
                      </div>
                    }
                    <!-- Approvers move this count while the page is open (AF-07): the read keeps the values and marks the page busy. -->
                    <div slToolbarItem [slToolbarItemCounterpart]="refreshItem">
                      <ng-container slTooltip openOn="hover" side="bottom">
                        <button
                          slIconButton
                          slTooltipTrigger
                          variant="ghost"
                          tone="secondary"
                          type="button"
                          aria-label="Refresh"
                          data-testid="refresh"
                          [loading]="store.loading()"
                          [messages]="{ loading: 'Refreshing' }"
                          (click)="store.load()"
                        >
                          <ng-icon name="lucideRefreshCw" />
                        </button>
                        <ng-template slTooltipLayer
                          ><div slTooltipContent>Refresh</div></ng-template
                        >
                      </ng-container>
                    </div>
                    @if (actions().includes('cancel')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="cancelItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          (click)="cancelOpen.set(true)"
                        >
                          Cancel count
                        </button>
                      </div>
                    }
                    <sl-toolbar-overflow />
                  </div>
                </div>
              }
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="count-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (count(); as c) {
              <div slGrid [columns]="phone() ? 2 : figureColumns()" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Lines</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ c.lineCount }}</span>
                    <p slStatCardComparison>SKUs in {{ warehouseCode() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Counted</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ countedFigure() }}</span>
                    <p slStatCardComparison>
                      of {{ c.lineCount }} {{ c.lineCount === 1 ? 'line' : 'lines' }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>With variance</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ varianceFigure() }}</span>
                    <p slStatCardComparison>lines differ from the snapshot</p>
                  </div>
                </div>
                @if (store.impactMinor() !== null) {
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Variance value</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ money(store.impactMinor()!) }}</span>
                      <p slStatCardComparison>
                        {{
                          store.needsApproval()
                            ? 'needs approval from'
                            : 'at standard cost; approval from'
                        }}
                        {{ money(threshold) }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                </div>
                <div slSectionBody>
                  <div slStack [gap]="4">
                    <app-record-progress
                      [steps]="steps()"
                      [sentence]="sentence()"
                      [stopped]="c.status === 'cancelled' ? 'danger' : null"
                    />
                    @if (permissionNote(); as note) {
                      <span slText size="sm" tone="muted" data-testid="count-permission">{{
                        note
                      }}</span>
                    }
                  </div>
                </div>
              </section>

              @if (store.approval(); as approval) {
                <section slSection>
                  <div slSectionHeader>
                    <div slSectionTitle><h2 slSectionHeading>Approval</h2></div>
                  </div>
                  <div slSectionBody>
                    <app-approval-panel
                      [approval]="approval"
                      [busy]="store.busy() === 'decision'"
                      [amountShown]="store.canSeeCost()"
                      [reasonsOverride]="store.canSeeCost() ? null : withheldReasons"
                      (decide)="decide($event)"
                    />
                  </div>
                </section>
              }
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the count' }" [loading]="true">
                <div slStack [gap]="6">
                  <div slGrid [columns]="phone() ? 2 : figureColumns()" minItemWidth="xs" [gap]="4">
                    @for (figure of figureLabels(); track figure) {
                      <div slStatCard size="sm" loading>
                        <div slStatCardHeader>
                          <span slStatCardLabel>{{ figure }}</span>
                        </div>
                        <div slStatCardFigure>
                          <span slStatCardValue>—</span>
                          <p slStatCardComparison>
                            <span slSkeletonText [lines]="1" lastLineSize="70%"></span>
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                    </div>
                    <div slSectionBody>
                      <div class="steps-shape">
                        @for (step of [1, 2, 3, 4]; track step) {
                          <span slSkeletonText [lines]="2" lastLineSize="60%"></span>
                        }
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            }

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle><h2 slSectionHeading>Lines</h2></div>
                @if (count()?.status === 'completed' && varianceFigure() > 0) {
                  <div slSectionActions>
                    <a
                      slButtonLink
                      variant="ghost"
                      tone="secondary"
                      size="sm"
                      [routerLink]="movementsRoute"
                      [queryParams]="{ source: count()!.id }"
                      >What this count moved</a
                    >
                  </div>
                }
              </div>
              <div slSectionBody>
                @if (counting()) {
                  <form
                    slForm
                    data-testid="count-form"
                    [messages]="{ summaryTitle: 'The count was not submitted' }"
                    [errors]="store.errors()"
                    (errorsChange)="store.errors.set($event.value)"
                    [loading]="store.busy() === 'submit'"
                    (formSubmit)="submit($event)"
                  >
                    <div
                      slTable
                      variant="framed"
                      [columns]="phone() ? 3 : 5"
                      [layout]="phone() ? 'fixed' : 'auto'"
                    >
                      <div slTableContent>
                        <caption slTableCaption>
                          What was counted in
                          {{
                            warehouseCode()
                          }}
                        </caption>
                        <thead slTableHead>
                          <tr slTableRow>
                            <th slTableColumnHeader>SKU</th>
                            @if (!phone()) {
                              <th slTableColumnHeader align="end" numeric>At the snapshot</th>
                            }
                            <th slTableColumnHeader>Counted</th>
                            <th slTableColumnHeader align="end" numeric>Variance</th>
                            @if (!phone()) {
                              <th slTableColumnHeader>Note</th>
                            }
                          </tr>
                        </thead>
                        <tbody slTableBody>
                          @for (row of store.rows(); track row.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <span slStack [gap]="1">
                                  <span class="cell-text" [title]="row.skuName">{{
                                    row.skuCode
                                  }}</span>
                                  <span class="cell-text" slText size="sm" tone="muted">{{
                                    row.locationCode
                                  }}</span>
                                </span>
                              </th>
                              @if (!phone()) {
                                <td slTableCell align="end" numeric>
                                  {{ amount(row.systemOnHand, row) }}
                                </td>
                              }
                              <td slTableCell>
                                <div slField [invalid]="!!error(key(row))">
                                  <div slNumberField size="sm">
                                    <input
                                      slNumberFieldInput
                                      [min]="0"
                                      [format]="{ maximumFractionDigits: row.precision }"
                                      [attr.aria-label]="'Counted of ' + row.skuCode"
                                      [value]="entry(row).quantity"
                                      (valueChange)="
                                        store.patch(row.id, { quantity: $event.value ?? null })
                                      "
                                    />
                                    <span slNumberFieldEnd>{{ row.unit }}</span>
                                  </div>
                                  @if (error(key(row)); as message) {
                                    <p slFieldError>{{ message }}</p>
                                  }
                                </div>
                              </td>
                              <td slTableCell align="end" numeric>
                                @if (row.draftVariance !== null) {
                                  <span
                                    [class.down]="milli(row.draftVariance) < 0"
                                    [class.up]="milli(row.draftVariance) > 0"
                                  >
                                    {{ delta(row.draftVariance) }}
                                  </span>
                                }
                              </td>
                              @if (!phone()) {
                                <td slTableCell>
                                  <div slTextField size="sm">
                                    <input
                                      slTextFieldInput
                                      [name]="'counted.' + row.id + '.note'"
                                      [attr.aria-label]="'Note on ' + row.skuCode"
                                      [value]="entry(row).note"
                                      (valueChange)="store.patch(row.id, { note: $event.value })"
                                    />
                                  </div>
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </div>
                    </div>
                    <div
                      slInlineMessage
                      [tone]="store.needsApproval() ? 'warning' : 'secondary'"
                      data-testid="approval-rule"
                    >
                      <span slInlineMessageIcon></span>
                      {{ approvalWords() }}
                    </div>
                    <div slFormActions>
                      <a
                        slButtonLink
                        variant="ghost"
                        tone="secondary"
                        [routerLink]="[]"
                        [queryParams]="{}"
                        >Keep counting later</a
                      >
                      <button
                        slButton
                        type="submit"
                        data-testid="submit-count"
                        [loading]="store.busy() === 'submit'"
                        [messages]="{ loading: 'Submitting the count' }"
                      >
                        Submit the count
                      </button>
                    </div>
                  </form>
                } @else {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 5"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        What this count covers
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>SKU</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>Location</th>
                          }
                          <th slTableColumnHeader align="end" numeric>At the snapshot</th>
                          @if (!phone()) {
                            <th slTableColumnHeader align="end" numeric>Counted</th>
                          }
                          <th slTableColumnHeader align="end" numeric>Variance</th>
                        </tr>
                      </thead>
                      <tbody slTableBody>
                        @if (count() === null) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="70%"></span>
                            </th>
                            @if (!phone()) {
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="4rem"></span>
                              </td>
                            }
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2rem"></span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell align="end">
                                <span slSkeleton shape="text" inlineSize="2rem"></span>
                              </td>
                            }
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2rem"></span>
                            </td>
                          </tr>
                        } @else {
                          @for (row of store.rows(); track row.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a
                                  slLink
                                  class="cell-text"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="position(row).path"
                                  [queryParams]="position(row).queryParams"
                                  [title]="row.skuCode + ' · ' + row.skuName"
                                >
                                  {{ row.skuCode }}
                                </a>
                              </th>
                              @if (!phone()) {
                                <td slTableCell>{{ row.locationCode }}</td>
                              }
                              <td slTableCell align="end" numeric>{{ snapshot(row) }}</td>
                              @if (!phone()) {
                                <td slTableCell align="end" numeric>
                                  {{ row.countedOnHand ? amount(row.countedOnHand, row) : '' }}
                                </td>
                              }
                              <td slTableCell align="end" numeric>
                                @if (row.variance !== undefined) {
                                  <span
                                    [class.down]="milli(row.variance) < 0"
                                    [class.up]="milli(row.variance) > 0"
                                  >
                                    {{ delta(row.variance) }}
                                  </span>
                                }
                              </td>
                            </tr>
                          }
                        }
                      </tbody>
                    </div>
                  </div>
                  @if (count()?.status === 'planned') {
                    <span slText size="sm" tone="muted"
                      >The snapshot is taken when the count starts; until then there is nothing to
                      compare with.</span
                    >
                  }
                }
              </div>
            </section>
          </div>
        </div>

        <ng-template #startItem>
          <button slMenuItem type="button" (click)="start()">Start counting</button>
        </ng-template>
        <ng-template #countItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ count: 1 }">Enter the count</a>
        </ng-template>
        <ng-template #completeItem>
          <button slMenuItem type="button" (click)="complete()">Complete the count</button>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (click)="store.load()">Refresh</button>
        </ng-template>
        <ng-template #cancelItem>
          <button slMenuItem type="button" (click)="cancelOpen.set(true)">Cancel count</button>
        </ng-template>

        <app-confirm-dialog
          [(open)]="cancelOpen"
          title="Cancel this count"
          description="No stock moves. What was counted so far is not kept; a new count is planned instead."
          confirmLabel="Cancel count"
          keepLabel="Keep the count"
          [busy]="store.busy() === 'cancel'"
          (confirm)="cancel()"
        />
        <app-reason-dialog
          [(open)]="rejectOpen"
          title="Reject this count"
          description="The count goes back to counting, with your words."
          label="Why is it rejected?"
          placeholder="Recount aisle B: the snapshot was taken mid-receipt."
          confirmLabel="Reject"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('reject', $event)"
        />
        <app-reason-dialog
          [(open)]="changesOpen"
          title="Ask for a recount"
          description="The count goes back to counting and its counter is told what to check."
          label="What has to be checked?"
          placeholder="Line 3 is off by a full case; count it again."
          confirmLabel="Ask for a recount"
          tone="warning"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('changes', $event)"
        />
      </div>
    }
  `,
})
export class CycleCountPage {
  readonly store = inject(CycleCountStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);

  readonly countsRoute = CYCLE_COUNTS_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly threshold = COUNT_APPROVAL_MINOR;
  readonly phone = phoneSignal();
  readonly milli = milli;
  readonly cancelOpen = signal(false);
  /** The policy's reason names the variance in dollars; without cost.view the rule is said instead. */
  readonly withheldReasons = [
    'The variance moves the stock by US$2,500 or more at standard cost. Its value is shown to holders of cost.view.',
  ];
  readonly rejectOpen = signal(false);
  readonly changesOpen = signal(false);

  readonly count = this.store.count;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  /** The count form is a query parameter, so the back gesture closes it and stays on the count. */
  readonly counting = computed(
    () =>
      this.queryParams().get('count') === '1' &&
      this.store.canCount() &&
      this.count()?.status === 'in_progress',
  );

  readonly actions = computed<readonly ('start' | 'count' | 'complete' | 'cancel')[]>(() => {
    const count = this.count();
    if (count === null || !this.store.canCount()) return [];
    if (count.status === 'planned') return ['start', 'cancel'];
    if (count.status === 'in_progress')
      return this.queryParams().get('count') === '1' ? ['cancel'] : ['count', 'cancel'];
    if (this.store.completable()) return ['complete'];
    return [];
  });

  readonly figureLabels = computed(() => [
    'Lines',
    'Counted',
    'With variance',
    ...(this.store.canSeeCost() ? ['Variance value'] : []),
  ]);
  readonly figureColumns = computed<3 | 4>(() => (this.figureLabels().length === 4 ? 4 : 3));

  readonly warehouseCode = computed(() => this.warehouses.code(this.count()?.warehouseId ?? ''));

  /** Whom the step waits on, in the words the approval chain uses. */
  readonly waitingOn = computed(() => {
    const approval = this.store.approval();
    if (approval === null || approval.status !== 'pending') return null;
    const step = [...approval.steps]
      .filter((candidate) => candidate.status === 'pending')
      .sort((a, b) => a.sequence - b.sequence)[0];
    return step ? `a ${step.requiredRole.replace(/_/g, ' ')}` : null;
  });

  readonly steps = computed(() => {
    const count = this.count();
    return count === null ? [] : countSteps(count, this.waitingOn());
  });
  readonly sentence = computed(() => {
    const count = this.count();
    return count === null ? '' : countSentence(count, this.waitingOn());
  });

  readonly statusWord = computed(() => {
    const status = this.count()?.status;
    return status ? CYCLE_COUNT_STATUS_LABEL[status] : '';
  });
  readonly statusTone = computed(() => {
    const status = this.count()?.status;
    return status ? CYCLE_COUNT_STATUS_TONE[status] : 'secondary';
  });

  readonly subheading = computed(() => {
    const count = this.count();
    if (count === null) return '';
    const who =
      count.assignedToIds.length === 1 ? '1 counter' : `${count.assignedToIds.length} counters`;
    return `${this.warehouseCode()} · planned for ${formatDate(count.plannedDate)} · ${who}`;
  });

  readonly countedFigure = computed(() => {
    const count = this.count();
    if (count === null) return 0;
    if (count.status === 'in_progress') return this.store.countedLines();
    return this.store.rows().filter((row) => row.countedOnHand !== undefined).length;
  });

  readonly varianceFigure = computed(() => {
    const count = this.count();
    if (count === null) return 0;
    if (count.status === 'in_progress')
      return this.store
        .rows()
        .filter((row) => row.draftVariance !== null && milli(row.draftVariance) !== 0).length;
    return count.varianceLineCount;
  });

  readonly permissionNote = computed(() => {
    void this.session.session();
    const count = this.count();
    if (count === null || this.store.canCount()) return '';
    if (count.status === 'completed' || count.status === 'cancelled') return '';
    return 'Counts are entered by holders of inventory.cycle_count in their warehouse: a warehouse operator or a warehouse manager.';
  });

  /** §62.2's threshold, said before the submit and in the reader's permission (PM-01). */
  readonly approvalWords = computed(() => {
    const impact = this.store.impactMinor();
    if (impact === null)
      return 'If the counted quantities move the stock by US$2,500 or more at standard cost, the count waits on a warehouse manager before it changes anything. The value is shown to holders of cost.view.';
    return this.store.needsApproval()
      ? `This count moves the stock by ${this.money(impact)} at standard cost: on submission it waits on a warehouse manager, and completes when approved.`
      : `This count moves the stock by ${this.money(impact)} at standard cost, under ${this.money(COUNT_APPROVAL_MINOR)}: it completes on submission.`;
  });

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      void this.store.open(id);
    });
  }

  missingStatus(code: string): 'not-found' | 'error' | 'forbidden' {
    return code === 'NOT_FOUND' ? 'not-found' : code === 'FORBIDDEN' ? 'forbidden' : 'error';
  }

  missingTitle(code: string): string {
    return code === 'NOT_FOUND'
      ? 'This count does not exist'
      : code === 'FORBIDDEN'
        ? 'This count is outside your warehouses'
        : 'The count could not be loaded';
  }

  key(row: CountLineRow): string {
    return `counted.${row.id}.quantity`;
  }

  entry(row: CountLineRow) {
    return this.store.entries()[row.id] ?? { quantity: null, note: '' };
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  position(row: CountLineRow) {
    return positionLink(row.skuId, this.count()?.warehouseId);
  }

  snapshot(row: CountLineRow): string {
    return this.count()?.status === 'planned' || this.count()?.startedAt === undefined
      ? ''
      : this.amount(row.systemOnHand, row);
  }

  amount(value: string, row: CountLineRow): string {
    return `${formatQuantity(value)} ${row.unit}`;
  }

  delta(value: string): string {
    return signed(value, formatQuantity);
  }

  money(minor: number): string {
    return formatMoney({ currency: 'USD', minor });
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  async start(): Promise<void> {
    if (await this.store.start())
      this.toasts.show({
        title: 'Counting started',
        description: 'Nexora took its snapshot of every line.',
        tone: 'success',
      });
  }

  async complete(): Promise<void> {
    if (await this.store.complete())
      this.toasts.show({
        title: 'Count completed',
        description: 'Each variance is now a movement in the ledger.',
        tone: 'success',
      });
  }

  async cancel(): Promise<void> {
    const ok = await this.store.cancel();
    this.cancelOpen.set(false);
    if (ok) this.toasts.show({ title: 'Count cancelled', tone: 'success' });
  }

  decide(decision: 'approve' | 'reject' | 'changes'): void {
    if (decision === 'reject') this.rejectOpen.set(true);
    else if (decision === 'changes') this.changesOpen.set(true);
    else void this.store.decide('approve', '');
  }

  async decided(decision: 'reject' | 'changes', reason: string): Promise<void> {
    await this.store.decide(decision, reason);
    this.rejectOpen.set(false);
    this.changesOpen.set(false);
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    if (!(await this.store.submit())) return;
    const count = this.count();
    this.toasts.show({
      title: count?.status === 'completed' ? 'Count completed' : 'Count submitted for approval',
      tone: 'success',
    });
    leaveForm(this.router, this.route, this.location, {});
  }
}
