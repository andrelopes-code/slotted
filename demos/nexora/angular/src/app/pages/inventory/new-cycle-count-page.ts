import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
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
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';
import { toISODate, type PlainDate } from '@slotted/core/date';

import { formatQuantity } from '../../core/catalog/catalog.model';
import { CycleCountDraftStore } from '../../core/inventory/cycle-count-draft.store';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { CYCLE_COUNTS_ROUTE } from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { chosenDate } from '../../core/chosen-date';

/**
 * A cycle count planned from nothing (§62): the warehouse, the day and the
 * SKUs. It stands on its own route under the counts (FM-01), its draft
 * outlives the page (FM-05), and each control carries the field name
 * `POST /cycle-counts` answers with (FM-02). A reader scoped to one warehouse
 * finds it chosen.
 */
@Component({
  selector: 'app-new-cycle-count-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCombobox,
    SlComboboxItem,
    SlDatePicker,
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
            <a slPageHeaderBack [routerLink]="countsRoute">Cycle counts</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Plan a count</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The count opens as planned. Nexora places each SKU in one of the warehouse's storage
              locations and snapshots what it holds when the count starts.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="work">
          <form
            slForm
            [messages]="{ summaryTitle: 'This count was not planned' }"
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
                  <div slSectionTitle><h2 slSectionHeading>Where and when</h2></div>
                </div>
                <div slSectionBody>
                  <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                    <div slField required [invalid]="!!error('warehouseId')">
                      <label slFieldLabel>Warehouse</label>
                      <sl-select
                        name="warehouseId"
                        data-testid="count-warehouse"
                        placeholder="Choose the warehouse"
                        [value]="store.warehouseId()"
                        (valueChangeRequest)="store.setWarehouse($any($event.value) ?? null)"
                      >
                        @for (row of store.places(); track row.id) {
                          <sl-select-item [value]="row.id"
                            >{{ row.code }} — {{ row.name }}</sl-select-item
                          >
                        }
                      </sl-select>
                      @if (error('warehouseId'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription>{{ placesWords() }}</span>
                      }
                    </div>
                    <div slField required [invalid]="!!error('plannedDate')">
                      <label slFieldLabel>Day of the count</label>
                      <div
                        slDatePicker
                        name="plannedDate"
                        [value]="plannedDate()"
                        (valueChange)="setDate(chosenDate($event.value))"
                      ></div>
                      @if (error('plannedDate'); as message) {
                        <p slFieldError>{{ message }}</p>
                      }
                    </div>
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>SKUs</h2>
                    <p slSectionDescription>
                      What is counted: SKUs the warehouse holds a position for.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slStack [gap]="5">
                    <div slField [invalid]="!!error('skuIds')">
                      <label slFieldLabel>Add a SKU</label>
                      <sl-combobox
                        data-testid="count-sku-search"
                        placeholder="Search the warehouse's stock by code or name"
                        [disabled]="store.warehouseId() === null"
                        [filter]="null"
                        [loading]="store.searching()"
                        [inputValue]="store.skuQuery()"
                        (inputValueChangeRequest)="store.search($event.value)"
                        [value]="null"
                        (valueChangeRequest)="add($event.value)"
                      >
                        @for (option of store.skuOptions(); track option.skuId) {
                          <sl-combobox-item
                            [value]="option.skuId"
                            [label]="option.skuCode + ' — ' + option.skuName"
                          />
                        }
                      </sl-combobox>
                      @if (error('skuIds'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription>Two letters are enough to search.</span>
                      }
                    </div>
                    @if (store.skus().length > 0) {
                      <div
                        slTable
                        variant="framed"
                        [columns]="3"
                        [layout]="phone() ? 'fixed' : 'auto'"
                      >
                        <div slTableContent>
                          <caption slTableCaption>
                            SKUs on this count
                          </caption>
                          <thead slTableHead>
                            <tr slTableRow>
                              <th slTableColumnHeader>SKU</th>
                              <th slTableColumnHeader align="end" numeric>On hand today</th>
                              <th slTableColumnHeader>Remove</th>
                            </tr>
                          </thead>
                          <tbody slTableBody>
                            @for (sku of store.skus(); track sku.skuId) {
                              <tr slTableRow>
                                <th slTableRowHeader>
                                  <span class="cell-text" [title]="sku.skuName">{{
                                    sku.skuCode
                                  }}</span>
                                </th>
                                <td slTableCell align="end" numeric>
                                  {{ quantity(sku.onHand) }} {{ sku.unit }}
                                </td>
                                <td slTableCell>
                                  <button
                                    slIconButton
                                    variant="ghost"
                                    tone="secondary"
                                    size="sm"
                                    type="button"
                                    [attr.aria-label]="'Remove ' + sku.skuCode"
                                    (click)="store.remove(sku.skuId)"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </div>
                      </div>
                      <span slText size="sm" tone="muted">
                        On hand today is what the warehouse holds now; the count compares with what
                        it holds when the count starts.
                      </span>
                    }
                  </div>
                </div>
              </section>
            </div>
            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="countsRoute">Cancel</a>
              <button
                slButton
                type="submit"
                data-testid="create-count"
                [loading]="store.creating()"
                [messages]="{ loading: 'Planning the count' }"
              >
                Plan the count
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NewCycleCountPage {
  readonly chosenDate = chosenDate;
  readonly store = inject(CycleCountDraftStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly countsRoute = CYCLE_COUNTS_ROUTE;
  readonly phone = phoneSignal();

  readonly plannedDate = computed<PlainDate | null>(() => {
    const [year, month, day] = this.store.plannedDate().split('-').map(Number);
    return year && month && day ? { year, month, day } : null;
  });

  readonly placesWords = computed(() =>
    this.store.places().length === 1
      ? 'The one warehouse your role counts in.'
      : 'Changing it empties the SKUs: they were chosen from its stock.',
  );

  constructor() {
    void this.store.prepare(this.session.session()?.demo.today ?? '');
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  setDate(value: PlainDate | null | undefined): void {
    this.store.plannedDate.set(value ? toISODate(value) : '');
  }

  add(value: unknown): void {
    const option = this.store.skuOptions().find((candidate) => candidate.skuId === value);
    if (option) this.store.add(option);
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

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const count = await this.store.create();
    if (count === null) return;
    this.toasts.show({
      title: `${count.cycleCountNumber} planned`,
      description: 'Start it when the counting begins: that is when Nexora takes its snapshot.',
      tone: 'success',
    });
    void this.router.navigateByUrl(`${CYCLE_COUNTS_ROUTE}/${count.id}`);
  }
}
