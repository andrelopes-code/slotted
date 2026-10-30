import { Component, computed, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSelect,
  SlTableSelectAll,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';

const STATUSES = [
  { value: 'processing', label: 'Processing', tone: 'accent' },
  { value: 'hold', label: 'On hold', tone: 'warning' },
  { value: 'ready', label: 'Ready to ship', tone: 'success' },
] as const;

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

type Status = (typeof STATUSES)[number]['value'];

const INITIAL: { id: string; customer: string; status: Status; warehouse: string }[] = [
  { id: 'SO-1182', customer: 'Contoso Foods', status: 'processing', warehouse: 'RNO' },
  { id: 'SO-1183', customer: 'Fabrikam Grocers', status: 'processing', warehouse: 'CMH' },
  { id: 'SO-1184', customer: 'Tailspin Market', status: 'hold', warehouse: 'RNO' },
  { id: 'SO-1185', customer: 'Woodgrove Deli', status: 'processing', warehouse: 'SAV' },
];

@Component({
  selector: 'app-dialog-bulk-edit',
  imports: [
    SlBadge,
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlField,
    SlFieldLabel,
    SlInline,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSelect,
    SlTableSelectAll,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline align="center" [gap]="3">
        <span slText size="sm" tone="muted">
          {{ count() === 0 ? 'Select orders to edit them together.' : count() + ' selected' }}
        </span>
        <button
          slButton
          focusableWhenDisabled
          size="sm"
          tone="secondary"
          variant="outline"
          [disabled]="count() === 0"
          [slDialogTrigger]="dialog"
        >
          Edit selected
        </button>
        <sl-dialog #dialog="slDialog" [open]="open()" (openChange)="toggle($event)">
          <header slDialogHeader>
            <h2 slDialogTitle>Edit {{ editing().length }} {{ noun() }}</h2>
            <p slDialogDescription>{{ editing().join(', ') }}</p>
            <button slDialogClose></button>
          </header>
          <div slDialogBody>
            <div slStack [gap]="4">
              <div slField>
                <label slFieldLabel>Status</label>
                <sl-select [items]="statuses" [(value)]="status">
                  @for (option of statuses; track option.value) {
                    <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
              <div slField>
                <label slFieldLabel>Ships from</label>
                <sl-select [items]="warehouses" [(value)]="warehouse">
                  @for (option of warehouses; track option.value) {
                    <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
            </div>
          </div>
          <footer slDialogFooter>
            <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
              Cancel
            </button>
            <button slButton (click)="apply()">Update {{ editing().length }} {{ noun() }}</button>
          </footer>
        </sl-dialog>
      </div>
      <div slTable selectionMode="multiple" [columns]="5" [(value)]="chosen">
        <div slTableContent>
          <thead slTableHead>
            <tr slTableRow>
              <th slTableSelectAll></th>
              <th slTableColumnHeader>Order</th>
              <th slTableColumnHeader>Customer</th>
              <th slTableColumnHeader>Status</th>
              <th slTableColumnHeader>Ships from</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (row of orders(); track row.id) {
              <tr slTableRow [value]="row.id">
                <td slTableSelect></td>
                <th slTableRowHeader>{{ row.id }}</th>
                <td slTableCell>{{ row.customer }}</td>
                <td slTableCell>
                  <span slBadge [tone]="statusOf(row.status).tone">
                    {{ statusOf(row.status).label }}
                  </span>
                </td>
                <td slTableCell>{{ warehouseOf(row.warehouse) }}</td>
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class DialogBulkEdit {
  readonly statuses = STATUSES;
  readonly warehouses = WAREHOUSES;
  readonly orders = signal(INITIAL);
  readonly chosen = signal<readonly string[]>([]);
  readonly editing = signal<readonly string[]>([]);
  readonly open = signal(false);
  readonly status = signal<SelectSelection>('ready');
  readonly warehouse = signal<SelectSelection>('RNO');
  readonly count = computed(() => this.chosen().length);
  readonly noun = computed(() => (this.editing().length === 1 ? 'order' : 'orders'));

  statusOf(value: Status) {
    return STATUSES.find((status) => status.value === value)!;
  }

  warehouseOf(value: string) {
    return WAREHOUSES.find((option) => option.value === value)?.label;
  }

  toggle(next: boolean): void {
    if (next) this.editing.set(this.chosen());
    this.open.set(next);
  }

  apply(): void {
    const editing = this.editing();
    const status = this.status() as Status;
    const warehouse = this.warehouse() as string;
    this.orders.update((rows) =>
      rows.map((row) => (editing.includes(row.id) ? { ...row, status, warehouse } : row)),
    );
    this.chosen.set([]);
    this.open.set(false);
  }
}
