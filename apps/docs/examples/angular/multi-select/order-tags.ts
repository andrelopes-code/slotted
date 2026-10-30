import { Component } from '@angular/core';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
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

const TAGS: MultiSelectOption[] = [
  { value: 'priority', label: 'priority' },
  { value: 'gift wrap', label: 'gift wrap' },
  { value: 'fragile', label: 'fragile' },
  { value: 'backorder', label: 'backorder' },
  { value: 'address check', label: 'address check' },
  { value: 'wholesale', label: 'wholesale' },
];

const ORDERS = [
  { id: 'SO-10482', customer: 'Harbor & Pine', tags: ['priority', 'fragile'] },
  { id: 'SO-10483', customer: 'Brightline Studio', tags: ['address check'] },
  { id: 'SO-10484', customer: 'Northgate Labs', tags: ['wholesale', 'backorder', 'priority'] },
  { id: 'SO-10485', customer: 'Verde Kitchen', tags: [] },
];

@Component({
  selector: 'app-multi-select-order-tags',
  imports: [
    SlMultiSelect,
    SlMultiSelectItem,
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
    <div slTable [columns]="3">
      <div slTableContent aria-label="Orders">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Tags</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of orders; track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader>{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell>
                <sl-multi-select
                  variant="plain"
                  size="sm"
                  overflow="collapse"
                  creatable
                  placeholder="Add a tag"
                  [aria-label]="'Tags for ' + order.id"
                  [items]="tags"
                  [value]="order.tags"
                >
                  @for (tag of tags; track tag.value) {
                    <sl-multi-select-item [value]="tag.value" [label]="tag.label" />
                  }
                </sl-multi-select>
              </td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class MultiSelectOrderTags {
  protected readonly tags = TAGS;
  protected readonly orders = ORDERS;
}
