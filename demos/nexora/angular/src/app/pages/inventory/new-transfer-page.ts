import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChangeRequest } from '@slotted/core/state';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderNav,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlSection,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
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
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';

import { formatQuantity } from '../../core/catalog/catalog.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { TRANSFERS_ROUTE } from '../../core/inventory/inventory.model';
import {
  TransferDraftStore,
  type TransferDraftLine,
} from '../../core/inventory/transfer-draft.store';
import { phoneSignal } from '../../core/layout/phone';

/**
 * A transfer written from nothing (§61): where it leaves, where it goes, and
 * the lines. It stands on its own route under the list it returns to (FM-01);
 * the draft is the store's and outlives the page (FM-05). Each control is
 * named as `POST /transfers` names the field (FM-02), and §61.2's rules are
 * said at the control before the command is sent: the destination list never
 * holds the source, a line is more than zero in the SKU's own precision, and a
 * line asking for more than the source holds is said to be one that marking
 * the transfer ready will refuse.
 */
@Component({
  selector: 'app-new-transfer-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCombobox,
    SlComboboxItem,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlForm,
    SlFormActions,
    SlGrid,
    SlIconButton,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderBack,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderNav,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlSection,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
    SlTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .work {
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
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack [routerLink]="transfersRoute">Transfers</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New transfer</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The transfer opens as a draft. Nothing leaves the source until it is marked ready and
              shipped, and the destination receives it line by line.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="work">
          <form
            slForm
            [messages]="{ summaryTitle: 'This transfer was not written' }"
            [errors]="store.errors()"
            (errorsChange)="store.errors.set($event.value)"
            [loading]="store.creating()"
            (formSubmit)="submit($event)"
          >
            @if (store.failure(); as failure) {
              @if (failure.kind !== 'validation') {
                <div slInlineMessage [tone]="tone(failure.kind)">
                  <span slInlineMessageIcon></span>
                  <span slStack [gap]="1">
                    <span slText size="sm">{{ failure.message }}</span>
                    <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                  </span>
                </div>
              }
            }
            <div slStack [gap]="6">
              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Route</h2>
                    <p slSectionDescription>
                      Where the stock leaves and where it goes. The two are always different
                      warehouses.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                    <div slField required [invalid]="!!error('sourceWarehouseId')">
                      <label slFieldLabel>From</label>
                      <sl-select
                        name="sourceWarehouseId"
                        data-testid="source"
                        placeholder="Choose the source"
                        [value]="store.sourceWarehouseId()"
                        (valueChangeRequest)="store.setSource($any($event.value) ?? null)"
                      >
                        @for (row of store.sources(); track row.id) {
                          <sl-select-item [value]="row.id"
                            >{{ row.code }} — {{ row.name }}</sl-select-item
                          >
                        }
                      </sl-select>
                      @if (error('sourceWarehouseId'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription
                          >Changing it empties the lines: they were chosen from its stock.</span
                        >
                      }
                    </div>
                    <div slField required [invalid]="!!error('destinationWarehouseId')">
                      <label slFieldLabel>To</label>
                      <sl-select
                        name="destinationWarehouseId"
                        data-testid="destination"
                        placeholder="Choose the destination"
                        [value]="store.destinationWarehouseId()"
                        (valueChangeRequest)="
                          store.destinationWarehouseId.set($any($event.value) ?? null)
                        "
                      >
                        @for (row of store.destinations(); track row.id) {
                          <sl-select-item [value]="row.id"
                            >{{ row.code }} — {{ row.name }}</sl-select-item
                          >
                        }
                      </sl-select>
                      @if (error('destinationWarehouseId'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription
                          >Every warehouse but the source; a closed one receives nothing.</span
                        >
                      }
                    </div>
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Lines</h2>
                    <p slSectionDescription>{{ linesWords() }}</p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slStack [gap]="5">
                    <div slField [invalid]="!!error('lines')">
                      <label slFieldLabel>Add a SKU</label>
                      <sl-combobox
                        data-testid="sku-search"
                        placeholder="Search the source's stock by code or name"
                        [disabled]="store.sourceWarehouseId() === null"
                        [filter]="null"
                        [loading]="store.searching()"
                        [inputValue]="store.skuQuery()"
                        (inputValueChangeRequest)="typed($event)"
                        [value]="null"
                        (valueChangeRequest)="add($event.value)"
                      >
                        @for (option of store.skuOptions(); track option.skuId) {
                          <sl-combobox-item
                            [value]="option.skuId"
                            [label]="
                              option.skuCode +
                              ' — ' +
                              option.skuName +
                              ' · ' +
                              option.available +
                              ' ' +
                              option.unitOfMeasure +
                              ' available'
                            "
                          />
                        }
                      </sl-combobox>
                      @if (error('lines'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription>Two letters are enough to search.</span>
                      }
                    </div>

                    @if (store.lines().length > 0) {
                      <div
                        slTable
                        variant="framed"
                        [columns]="phone() ? 3 : 4"
                        [layout]="phone() ? 'fixed' : 'auto'"
                      >
                        <div slTableContent>
                          <caption slTableCaption>
                            Lines on this draft
                          </caption>
                          <thead slTableHead>
                            <tr slTableRow>
                              <th slTableColumnHeader>SKU</th>
                              @if (!phone()) {
                                <th slTableColumnHeader align="end" numeric>Available at source</th>
                              }
                              <th slTableColumnHeader>Quantity</th>
                              <th slTableColumnHeader>Remove</th>
                            </tr>
                          </thead>
                          <tbody slTableBody>
                            @for (line of store.lines(); track line.skuId) {
                              <tr slTableRow>
                                <th slTableRowHeader>
                                  <span slStack [gap]="1">
                                    <span
                                      class="cell-text"
                                      slText
                                      size="sm"
                                      weight="medium"
                                      [title]="line.skuName"
                                      >{{ line.skuCode }}</span
                                    >
                                    <span
                                      class="cell-text"
                                      slText
                                      size="sm"
                                      tone="muted"
                                      [title]="line.skuName"
                                      >{{ line.skuName }}</span
                                    >
                                  </span>
                                </th>
                                @if (!phone()) {
                                  <td slTableCell align="end" numeric>
                                    {{ quantity(line.available) }} {{ line.unit }}
                                  </td>
                                }
                                <td slTableCell>
                                  <div slField [invalid]="!!error(lineKey(line))">
                                    <div slNumberField size="sm">
                                      <input
                                        slNumberFieldInput
                                        [min]="0"
                                        [format]="{ maximumFractionDigits: line.precision }"
                                        [attr.aria-label]="'Quantity of ' + line.skuCode"
                                        [value]="line.quantity"
                                        (valueChange)="
                                          store.setQuantity(line.skuId, $event.value ?? null)
                                        "
                                      />
                                      <span slNumberFieldEnd>{{ line.unit }}</span>
                                    </div>
                                    @if (error(lineKey(line)); as message) {
                                      <p slFieldError>{{ message }}</p>
                                    } @else if (isShort(line)) {
                                      <span slFieldDescription
                                        >More than {{ line.available }} available today: marking the
                                        transfer ready will be refused until it is there.</span
                                      >
                                    }
                                  </div>
                                </td>
                                <td slTableCell>
                                  <button
                                    slIconButton
                                    variant="ghost"
                                    tone="secondary"
                                    size="sm"
                                    type="button"
                                    [attr.aria-label]="'Remove ' + line.skuCode"
                                    (click)="store.remove(line.skuId)"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Notes</h2></div>
                </div>
                <div slSectionBody>
                  <div slField>
                    <label slFieldLabel>Notes</label>
                    <textarea
                      slTextarea
                      name="notes"
                      [rows]="3"
                      [value]="store.notes()"
                      (valueChange)="store.notes.set($event.value)"
                      placeholder="Rebalance for the Dallas backorders."
                    ></textarea>
                  </div>
                </div>
              </section>
            </div>

            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="transfersRoute"
                >Cancel</a
              >
              <button
                slButton
                type="submit"
                data-testid="create-transfer"
                [loading]="store.creating()"
                [messages]="{ loading: 'Writing the transfer' }"
              >
                Write the draft
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NewTransferPage {
  readonly store = inject(TransferDraftStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(SlToastService);

  readonly transfersRoute = TRANSFERS_ROUTE;
  readonly phone = phoneSignal();

  readonly linesWords = computed(() =>
    this.store.sourceWarehouseId() === null
      ? 'Choose the source first: a line is a SKU the source holds.'
      : 'Each line is one SKU the source holds, in the SKU’s own unit.',
  );

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    void this.store.prefill(params.get('from'), params.get('to'), params.get('sku'));
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  lineKey(line: TransferDraftLine): string {
    return `lines.${line.skuId}.quantity`;
  }

  isShort(line: TransferDraftLine): boolean {
    return this.store.short().some((candidate) => candidate.skuId === line.skuId);
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

  /** The label written on a choice is refused, so the picker stays empty for the next SKU. */
  typed(request: ChangeRequest<string>): void {
    if (request.reason === 'select') {
      request.cancel();
      return;
    }
    void this.store.search(request.value);
  }

  add(value: unknown): void {
    const option = this.store.skuOptions().find((candidate) => candidate.skuId === value);
    if (option) void this.store.add(option);
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const transfer = await this.store.create();
    if (transfer === null) return;
    this.toasts.show({
      title: `${transfer.transferNumber} written as a draft`,
      description: 'Mark it ready when the source has the stock to send.',
      tone: 'success',
    });
    void this.router.navigateByUrl(`${TRANSFERS_ROUTE}/${transfer.id}`);
  }
}
