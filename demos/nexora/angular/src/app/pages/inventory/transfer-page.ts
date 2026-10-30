import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
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
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';

import { formatDate, formatQuantity } from '../../core/catalog/catalog.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import {
  milli,
  MOVEMENTS_ROUTE,
  positionLink,
  TRANSFER_STATUS_LABEL,
  TRANSFER_STATUS_TONE,
  TRANSFERS_ROUTE,
} from '../../core/inventory/inventory.model';
import { TransferStore, type TransferLineRow } from '../../core/inventory/transfer.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { RecordProgress } from '../record-progress/record-progress';
import { ConfirmDialog } from './confirm-dialog';
import { transferSentence, transferSteps } from './inventory-progress';
import { leaveForm } from './leave-form';

/**
 * One transfer (§61): where it stands in its cycle and what that step waits
 * on (RP-06), its lines, and the commands the reader's permissions allow in
 * that step. A command the backend would refuse in this state is not drawn:
 * cancelling is offered on a draft and a ready transfer only (§61.3), so a
 * shipped transfer has no Cancel and the sentence under its steps says why.
 *
 * The receipt is written in the lines' own section (FM-07), a line at a time
 * with its damaged units; what the reader typed survives a refusal, and a
 * receipt that leaves quantity outstanding is reported as the partial success
 * it is (§33).
 */

@Component({
  selector: 'app-transfer-page',
  imports: [
    ConfirmDialog,
    RecordProgress,
    RouterLink,
    SlButton,
    SlButtonLink,
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
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
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
    /* The steps' shape while the transfer is read: four cells, as the loaded element draws them. */
    .steps-shape {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--slotted-space-2);
    }
  `,
  template: `
    @if (store.error() || store.outOfScope()) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="transfersRoute">Transfers</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Transfer</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="missingStatus()"
            reach="section"
            data-testid="transfer-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ missingTitle() }}</h2>
              <p slResultStateDescription>{{ missingWords() }}</p>
            </div>
            <div slResultStateActions>
              @if (missingStatus() === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="transfersRoute"
                >Back to transfers</a
              >
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.transfer() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="transfersRoute">Transfers</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ transfer()?.transferNumber ?? 'Transfer' }}</h1>
                @if (transfer(); as t) {
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
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (actions().length > 0) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Transfer actions" overflow="menu">
                    @if (actions().includes('receive')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="receiveItem">
                        <a
                          slButtonLink
                          data-testid="receive"
                          [routerLink]="[]"
                          [queryParams]="{ receive: 1 }"
                          >Receive</a
                        >
                      </div>
                    }
                    @if (actions().includes('ready')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="readyItem">
                        <button
                          slButton
                          type="button"
                          data-testid="mark-ready"
                          [loading]="store.busy() === 'ready'"
                          [messages]="{ loading: 'Marking ready' }"
                          (click)="markReady()"
                        >
                          Mark ready
                        </button>
                      </div>
                    }
                    @if (actions().includes('ship')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="shipItem">
                        <button
                          slButton
                          type="button"
                          data-testid="ship"
                          [loading]="store.busy() === 'ship'"
                          [messages]="{ loading: 'Shipping' }"
                          (click)="ship()"
                        >
                          Ship
                        </button>
                      </div>
                    }
                    @if (actions().includes('cancel')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="cancelItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="cancel-transfer"
                          (click)="cancelOpen.set(true)"
                        >
                          Cancel transfer
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
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="transfer-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }
            @if (store.received(); as result) {
              <div
                slInlineMessage
                [tone]="result.partial > 0 ? 'warning' : 'success'"
                data-testid="received"
              >
                <span slInlineMessageIcon></span>
                {{ receivedWords(result) }}
              </div>
            }

            @if (transfer(); as t) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Lines</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ rows().length }}</span>
                    <p slStatCardComparison>each in its SKU’s own unit</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Shipped</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ shippedLines() }}</span>
                    <p slStatCardComparison>
                      of {{ lines(rows().length) }} left {{ t.sourceWarehouseCode }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Received</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ receivedLines() }}</span>
                    <p slStatCardComparison>
                      of {{ lines(rows().length) }} in full at {{ t.destinationWarehouseCode }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Damaged</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ damagedLines() }}</span>
                    <p slStatCardComparison>
                      {{ damagedLines() === 1 ? 'line' : 'lines' }} arrived with damaged units
                    </p>
                  </div>
                </div>
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
                      [stopped]="t.status === 'cancelled' ? 'danger' : null"
                    />
                    @if (t.status === 'draft' && store.short().length > 0) {
                      <div slInlineMessage tone="warning" data-testid="short">
                        <span slInlineMessageIcon></span>
                        {{ shortWords() }}
                      </div>
                    }
                    @if (t.notes) {
                      <span slText size="sm">Note: {{ t.notes }}</span>
                    }
                    @if (permissionNote(); as note) {
                      <span slText size="sm" tone="muted" data-testid="transfer-permission">{{
                        note
                      }}</span>
                    }
                  </div>
                </div>
              </section>
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the transfer' }" [loading]="true">
                <div slStack [gap]="6">
                  <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                    @for (figure of figureLabels; track figure) {
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
                @if (transfer() && hasMoved()) {
                  <div slSectionActions>
                    <a
                      slButtonLink
                      variant="ghost"
                      tone="secondary"
                      size="sm"
                      [routerLink]="movementsRoute"
                      [queryParams]="{ source: transfer()!.id }"
                      >What this transfer moved</a
                    >
                  </div>
                }
              </div>
              <div slSectionBody>
                @if (receiving()) {
                  <form
                    slForm
                    data-testid="receive-form"
                    [messages]="{ summaryTitle: 'Nothing was received' }"
                    [errors]="store.receiptErrors()"
                    (errorsChange)="store.receiptErrors.set($event.value)"
                    [loading]="store.busy() === 'receive'"
                    (formSubmit)="receive($event)"
                  >
                    @if (receiptError('received'); as message) {
                      <div slInlineMessage tone="danger">
                        <span slInlineMessageIcon></span>
                        {{ message }}
                      </div>
                    }
                    <div
                      slTable
                      variant="framed"
                      [columns]="phone() ? 3 : 5"
                      [layout]="phone() ? 'fixed' : 'auto'"
                    >
                      <div slTableContent>
                        <caption slTableCaption>
                          What arrived at
                          {{
                            transfer()?.destinationWarehouseCode
                          }}
                        </caption>
                        <thead slTableHead>
                          <tr slTableRow>
                            <th slTableColumnHeader>SKU</th>
                            @if (!phone()) {
                              <th slTableColumnHeader align="end" numeric>Outstanding</th>
                            }
                            <th slTableColumnHeader>Received</th>
                            <th slTableColumnHeader>Of it damaged</th>
                          </tr>
                        </thead>
                        <tbody slTableBody>
                          @for (row of rows(); track row.id) {
                            @if (open(row)) {
                              <tr slTableRow>
                                <th slTableRowHeader>
                                  <span class="cell-text" [title]="row.skuName">{{
                                    row.skuCode
                                  }}</span>
                                </th>
                                @if (!phone()) {
                                  <td slTableCell align="end" numeric>
                                    {{ quantity(row.outstanding) }} {{ row.unit }}
                                  </td>
                                }
                                <td slTableCell>
                                  <div slField [invalid]="!!receiptError(key(row, 'quantity'))">
                                    <div slNumberField size="sm">
                                      <input
                                        slNumberFieldInput
                                        [min]="0"
                                        [format]="{ maximumFractionDigits: row.precision }"
                                        [attr.aria-label]="'Received of ' + row.skuCode"
                                        [value]="entry(row).quantity"
                                        (valueChange)="
                                          store.patchReceipt(row.id, {
                                            quantity: $event.value ?? null,
                                          })
                                        "
                                      />
                                      <span slNumberFieldEnd>{{ row.unit }}</span>
                                    </div>
                                    @if (receiptError(key(row, 'quantity')); as message) {
                                      <p slFieldError>{{ message }}</p>
                                    }
                                  </div>
                                </td>
                                <td slTableCell>
                                  <div slField [invalid]="!!receiptError(key(row, 'damaged'))">
                                    <div slNumberField size="sm">
                                      <input
                                        slNumberFieldInput
                                        [min]="0"
                                        [format]="{ maximumFractionDigits: row.precision }"
                                        [attr.aria-label]="'Damaged of ' + row.skuCode"
                                        [value]="entry(row).damaged"
                                        (valueChange)="
                                          store.patchReceipt(row.id, {
                                            damaged: $event.value ?? null,
                                          })
                                        "
                                      />
                                      <span slNumberFieldEnd>{{ row.unit }}</span>
                                    </div>
                                    @if (receiptError(key(row, 'damaged')); as message) {
                                      <p slFieldError>{{ message }}</p>
                                    }
                                  </div>
                                </td>
                              </tr>
                            }
                          }
                        </tbody>
                      </div>
                    </div>
                    <span slText size="sm" tone="muted">
                      A line received short stays open for the rest. Damaged units enter
                      {{ transfer()?.destinationWarehouseCode }}'s stock and its damaged bucket at
                      once, so they are counted and never sold.
                    </span>
                    <div slFormActions>
                      <a
                        slButtonLink
                        variant="ghost"
                        tone="secondary"
                        [routerLink]="[]"
                        [queryParams]="{}"
                        >Cancel</a
                      >
                      <button
                        slButton
                        type="submit"
                        data-testid="receive-submit"
                        [loading]="store.busy() === 'receive'"
                        [messages]="{ loading: 'Receiving' }"
                      >
                        Receive
                      </button>
                    </div>
                  </form>
                } @else {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 6"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        What this transfer carries
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>SKU</th>
                          <th slTableColumnHeader align="end" numeric>Requested</th>
                          @if (!phone()) {
                            <th slTableColumnHeader align="end" numeric>Shipped</th>
                            <th slTableColumnHeader align="end" numeric>Received</th>
                            <th slTableColumnHeader align="end" numeric>Damaged</th>
                          }
                          <th slTableColumnHeader align="end" numeric>
                            {{ phone() ? 'Still due' : 'Outstanding' }}
                          </th>
                        </tr>
                      </thead>
                      <tbody slTableBody>
                        @if (transfer() === null) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="70%"></span>
                            </th>
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2rem"></span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell align="end">
                                <span slSkeleton shape="text" inlineSize="2rem"></span>
                              </td>
                              <td slTableCell align="end">
                                <span slSkeleton shape="text" inlineSize="2rem"></span>
                              </td>
                              <td slTableCell align="end">
                                <span slSkeleton shape="text" inlineSize="1.5rem"></span>
                              </td>
                            }
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2rem"></span>
                            </td>
                          </tr>
                        } @else {
                          @for (row of rows(); track row.id) {
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
                              <td slTableCell align="end" numeric>
                                {{ amount(row.requestedQuantity, row) }}
                              </td>
                              @if (!phone()) {
                                <td slTableCell align="end" numeric>
                                  {{ amount(row.shippedQuantity, row) }}
                                </td>
                                <td slTableCell align="end" numeric>
                                  {{ amount(row.receivedQuantity, row) }}
                                </td>
                                <td slTableCell align="end" numeric>
                                  {{ amount(row.damagedQuantity, row) }}
                                </td>
                              }
                              <td slTableCell align="end" numeric>
                                {{ amount(row.outstanding, row) }}
                              </td>
                            </tr>
                          }
                        }
                      </tbody>
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>

        <ng-template #receiveItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ receive: 1 }">Receive</a>
        </ng-template>
        <ng-template #readyItem>
          <button slMenuItem type="button" (click)="markReady()">Mark ready</button>
        </ng-template>
        <ng-template #shipItem>
          <button slMenuItem type="button" (click)="ship()">Ship</button>
        </ng-template>
        <ng-template #cancelItem>
          <button slMenuItem type="button" (click)="cancelOpen.set(true)">Cancel transfer</button>
        </ng-template>

        <app-confirm-dialog
          [(open)]="cancelOpen"
          title="Cancel this transfer"
          description="Nothing has shipped, so no stock moves. A cancelled transfer cannot be opened again; a new one is written instead."
          confirmLabel="Cancel transfer"
          keepLabel="Keep the transfer"
          [busy]="store.busy() === 'cancel'"
          (confirm)="cancel()"
        />
      </div>
    }
  `,
})
export class TransferPage {
  readonly store = inject(TransferStore);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);

  readonly transfersRoute = TRANSFERS_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly phone = phoneSignal();
  readonly figureLabels = ['Lines', 'Shipped', 'Received', 'Damaged'];
  readonly cancelOpen = signal(false);

  readonly transfer = this.store.transfer;
  readonly rows = this.store.rows;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  /** The receipt form is a query parameter, so the back gesture closes it and stays on the transfer. */
  readonly receiving = computed(() => {
    const status = this.transfer()?.status;
    return (
      this.queryParams().get('receive') === '1' &&
      this.store.canReceive() &&
      (status === 'in_transit' || status === 'partially_received')
    );
  });

  /** The commands this state allows and this reader holds, in the order they are read. */
  readonly actions = computed<readonly ('ready' | 'ship' | 'receive' | 'cancel')[]>(() => {
    const transfer = this.transfer();
    if (transfer === null) return [];
    const source = this.store.canMoveAtSource();
    const destination = this.store.canReceive();
    switch (transfer.status) {
      case 'draft':
        return source ? ['ready', 'cancel'] : [];
      case 'ready':
        return source ? ['ship', 'cancel'] : [];
      case 'in_transit':
      case 'partially_received':
        return destination && this.queryParams().get('receive') !== '1' ? ['receive'] : [];
      default:
        return [];
    }
  });

  readonly steps = computed(() => {
    const transfer = this.transfer();
    return transfer === null ? [] : transferSteps(transfer);
  });
  readonly sentence = computed(() => {
    const transfer = this.transfer();
    return transfer === null ? '' : transferSentence(transfer);
  });

  readonly statusWord = computed(() => {
    const status = this.transfer()?.status;
    return status ? TRANSFER_STATUS_LABEL[status] : '';
  });
  readonly statusTone = computed(() => {
    const status = this.transfer()?.status;
    return status ? TRANSFER_STATUS_TONE[status] : 'secondary';
  });

  readonly subheading = computed(() => {
    const transfer = this.transfer();
    if (transfer === null) return '';
    return `${transfer.sourceWarehouseCode} → ${transfer.destinationWarehouseCode} · ${transfer.requestedByName} · ${formatDate(transfer.requestedDate)}`;
  });

  readonly shippedLines = computed(
    () => this.rows().filter((row) => milli(row.shippedQuantity) > 0).length,
  );
  readonly receivedLines = computed(
    () =>
      this.rows().filter((row) => milli(row.shippedQuantity) > 0 && milli(row.outstanding) === 0)
        .length,
  );
  readonly damagedLines = computed(
    () => this.rows().filter((row) => milli(row.damagedQuantity) > 0).length,
  );
  readonly hasMoved = computed(() => this.shippedLines() > 0);

  /** One sentence where the reader holds no command on this transfer (PM-02's shape, for a control). */
  readonly permissionNote = computed(() => {
    void this.session.session();
    const transfer = this.transfer();
    if (transfer === null || this.actions().length > 0) return '';
    if (transfer.status === 'received' || transfer.status === 'cancelled') return '';
    if (this.session.can('inventory.transfer')) return '';
    return 'Transfers are moved by holders of inventory.transfer: an administrator, a warehouse manager or a procurement manager.';
  });

  readonly shortWords = computed(() => {
    const short = this.store.short();
    const lines = short
      .map(
        (row) =>
          `${row.skuCode} (${row.availableAtSource ?? '0'} of ${row.requestedQuantity} ${row.unit})`,
      )
      .join(', ');
    return `${this.transfer()?.sourceWarehouseCode} does not hold enough today for ${lines}. Marking the transfer ready will be refused until it does.`;
  });

  readonly missingStatus = computed<'not-found' | 'error' | 'forbidden'>(() => {
    if (this.store.outOfScope()) return 'forbidden';
    return this.store.error()?.code === 'NOT_FOUND' ? 'not-found' : 'error';
  });
  readonly missingTitle = computed(() => {
    const status = this.missingStatus();
    return status === 'forbidden'
      ? 'This transfer is outside your warehouses'
      : status === 'not-found'
        ? 'This transfer does not exist'
        : 'The transfer could not be loaded';
  });
  readonly missingWords = computed(() => {
    const status = this.missingStatus();
    if (status === 'forbidden')
      return 'It neither leaves nor reaches a warehouse your role is scoped to, so its lines are not yours to read.';
    return this.store.error()?.message ?? '';
  });

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      void this.store.open(id);
    });
    // The form opens on what is outstanding; a receipt already typed is kept (FM-05).
    effect(() => {
      if (!this.receiving() || this.rows().length === 0) return;
      untracked(() => {
        if (Object.keys(this.store.receipt()).length === 0) this.store.startReceipt();
      });
    });
  }

  lines(count: number): string {
    return `${count} ${count === 1 ? 'line' : 'lines'}`;
  }

  open(row: TransferLineRow): boolean {
    return milli(row.outstanding) > 0;
  }

  entry(row: TransferLineRow) {
    return this.store.receipt()[row.id] ?? { quantity: null, damaged: null };
  }

  key(row: TransferLineRow, field: 'quantity' | 'damaged'): string {
    return `received.${row.id}.${field}`;
  }

  receiptError(name: string): string | null {
    return this.store.receiptErrors()[name]?.[0] ?? null;
  }

  position(row: TransferLineRow) {
    const transfer = this.transfer();
    return positionLink(row.skuId, transfer?.destinationWarehouseId);
  }

  amount(value: string, row: TransferLineRow): string {
    return `${formatQuantity(value)} ${row.unit}`;
  }

  quantity(value: string): string {
    return formatQuantity(value);
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  receivedWords(result: { complete: number; partial: number; damaged: number }): string {
    const lines = (n: number) => `${n} ${n === 1 ? 'line' : 'lines'}`;
    const parts: string[] = [];
    if (result.complete > 0) parts.push(`${lines(result.complete)} received in full`);
    if (result.partial > 0)
      parts.push(`${lines(result.partial)} received in part: the rest stays open on the transfer`);
    const damaged =
      result.damaged > 0
        ? ` Damaged units on ${lines(result.damaged)} went into the damaged bucket at ${this.transfer()?.destinationWarehouseCode}.`
        : '';
    const sentence = parts.join('; ');
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.${damaged}`;
  }

  async markReady(): Promise<void> {
    if (await this.store.markReady())
      this.toasts.show({ title: 'Marked ready to ship', tone: 'success' });
  }

  async ship(): Promise<void> {
    if (await this.store.ship())
      this.toasts.show({
        title: `Shipped from ${this.transfer()?.sourceWarehouseCode}`,
        description: 'The stock left the source; the destination receives it.',
        tone: 'success',
      });
  }

  async cancel(): Promise<void> {
    const ok = await this.store.cancel();
    this.cancelOpen.set(false);
    if (ok) this.toasts.show({ title: 'Transfer cancelled', tone: 'success' });
  }

  receive(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeReceipt());
  }

  private async writeReceipt(): Promise<void> {
    if (!(await this.store.receive())) return;
    leaveForm(this.router, this.route, this.location, {});
  }
}
