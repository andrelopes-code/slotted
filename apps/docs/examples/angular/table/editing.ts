import { Component, signal } from '@angular/core';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';

const BINS = ['A-04', 'A-07', 'B-12', 'C-01'];

const STOCK = [
  { sku: 'PRD-0412', product: 'Chai', counted: 390, bin: 'A-04' },
  { sku: 'PRD-0413', product: 'Chang', counted: 170, bin: 'A-04' },
  { sku: 'PRD-0414', product: 'Aniseed Syrup', counted: 130, bin: 'B-12' },
  { sku: 'PRD-0415', product: "Chef Anton's Cajun Seasoning", counted: 53, bin: 'C-01' },
];

type Line = (typeof STOCK)[number];

@Component({
  selector: 'app-table-editing',
  imports: [
    SlNumberField,
    SlNumberFieldInput,
    SlSelect,
    SlSelectItem,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slTable [columns]="4">
      <div slTableContent aria-label="Stock take, Reno">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>SKU</th>
            <th slTableColumnHeader>Product</th>
            <th slTableColumnHeader numeric>Counted</th>
            <th slTableColumnHeader>Bin</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (line of lines(); track line.sku) {
            <tr slTableRow [value]="line.sku">
              <th slTableRowHeader text="nowrap">{{ line.sku }}</th>
              <td slTableCell>{{ line.product }}</td>
              <td slTableCell numeric>
                <div slNumberField size="sm" stepper="none" variant="plain">
                  <input
                    slNumberFieldInput
                    min="0"
                    [attr.aria-label]="'Counted for ' + line.sku"
                    [value]="line.counted"
                    (valueChange)="update(line.sku, { counted: $event.value ?? 0 })"
                  />
                </div>
              </td>
              <td slTableCell>
                <sl-select
                  size="sm"
                  variant="plain"
                  [aria-label]="'Bin of ' + line.sku"
                  [value]="line.bin"
                  (valueChange)="setBin(line.sku, $event)"
                >
                  @for (bin of bins; track bin) {
                    <sl-select-item [value]="bin">{{ bin }}</sl-select-item>
                  }
                </sl-select>
              </td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableEditing {
  readonly bins = BINS;
  readonly lines = signal<readonly Line[]>(STOCK);

  setBin(sku: string, bin: SelectSelection): void {
    if (typeof bin === 'string') this.update(sku, { bin });
  }

  update(sku: string, change: Partial<Line>): void {
    this.lines.update((current) =>
      current.map((line) => (line.sku === sku ? { ...line, ...change } : line)),
    );
  }
}
