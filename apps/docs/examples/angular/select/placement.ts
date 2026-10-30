import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';

const PAGE_SIZES: SelectOption[] = [
  { value: '25', label: '25 rows' },
  { value: '50', label: '50 rows' },
  { value: '100', label: '100 rows' },
];

const SORTS: (SelectOption & { description: string })[] = [
  { value: 'newest', label: 'Newest', description: 'Most recent order date first.' },
  { value: 'total', label: 'Total', description: 'Largest order total first.' },
  { value: 'ship-date', label: 'Ship date', description: 'Earliest promised ship date first.' },
];

@Component({
  selector: 'app-select-placement',
  imports: [SlInline, SlSelect, SlSelectItem],
  template: `
    <div slInline [gap]="3" justify="between" align="center">
      <sl-select
        aria-label="Rows per page"
        side="top"
        value="25"
        [fullWidth]="false"
        [items]="pageSizes"
      >
        @for (size of pageSizes; track size.value) {
          <sl-select-item [value]="size.value">{{ size.label }}</sl-select-item>
        }
      </sl-select>
      <sl-select
        aria-label="Sort orders"
        align="end"
        width="content"
        value="newest"
        [fullWidth]="false"
        [items]="sorts"
      >
        @for (sort of sorts; track sort.value) {
          <sl-select-item [value]="sort.value" [description]="sort.description">{{
            sort.label
          }}</sl-select-item>
        }
      </sl-select>
    </div>
  `,
})
export class SelectPlacement {
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly sorts = SORTS;
}
