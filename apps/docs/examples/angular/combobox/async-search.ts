import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

interface Customer {
  id: string;
  name: string;
  city: string;
}

const DIRECTORY: Customer[] = [
  { id: 'brightline', name: 'Brightline Studio', city: 'Portland, OR' },
  { id: 'harbor-pine', name: 'Harbor & Pine', city: 'Seattle, WA' },
  { id: 'northgate', name: 'Northgate Labs', city: 'Austin, TX' },
  { id: 'quill', name: 'Quill & Co.', city: 'Brooklyn, NY' },
  { id: 'solstice', name: 'Solstice Outdoor', city: 'Boulder, CO' },
  { id: 'verde', name: 'Verde Kitchen', city: 'Oakland, CA' },
  { id: 'atlas', name: 'Atlas Freight', city: 'Memphis, TN' },
  { id: 'juniper', name: 'Juniper Health', city: 'Minneapolis, MN' },
  { id: 'kestrel', name: 'Kestrel Robotics', city: 'Pittsburgh, PA' },
  { id: 'larkspur', name: 'Larkspur Books', city: 'Asheville, NC' },
  { id: 'meridian', name: 'Meridian Hotels', city: 'Chicago, IL' },
  { id: 'oakline', name: 'Oakline Furniture', city: 'Grand Rapids, MI' },
  { id: 'pelican', name: 'Pelican Coffee', city: 'Tampa, FL' },
  { id: 'saltmarsh', name: 'Saltmarsh Dairy', city: 'Burlington, VT' },
  { id: 'tidewater', name: 'Tidewater Supply', city: 'Norfolk, VA' },
];

/** Stands in for a request to the server, which answers after 600 ms. */
function searchCustomers(query: string): Promise<Customer[]> {
  const needle = query.trim().toLowerCase();
  const found = DIRECTORY.filter((customer) => customer.name.toLowerCase().includes(needle));
  return new Promise((resolve) => setTimeout(() => resolve(found), 600));
}

@Component({
  selector: 'app-combobox-async-search',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Customer</label>
      <sl-combobox
        placeholder="Search 15 customers"
        [filter]="null"
        [inputValue]="query()"
        [loading]="loading()"
        [messages]="{ empty: emptyMessage() }"
        (inputValueChange)="type($event)"
      >
        @for (customer of results(); track customer.id) {
          <sl-combobox-item
            [value]="customer.id"
            [label]="customer.name"
            [description]="customer.city"
          />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxAsyncSearch {
  protected readonly query = signal('');
  protected readonly results = signal<Customer[]>([]);
  protected readonly loading = signal(false);
  protected readonly emptyMessage = computed(() =>
    this.query().trim() === '' ? 'Type a name to search.' : 'No customer by that name.',
  );
  private debounce: ReturnType<typeof setTimeout> | undefined;
  private latest = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.debounce));
  }

  protected type(text: string) {
    this.query.set(text);
    clearTimeout(this.debounce);
    const request = ++this.latest;
    if (text.trim() === '') {
      this.results.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.debounce = setTimeout(() => {
      void searchCustomers(text).then((found) => {
        if (request !== this.latest) return;
        this.results.set(found);
        this.loading.set(false);
      });
    }, 250);
  }
}
