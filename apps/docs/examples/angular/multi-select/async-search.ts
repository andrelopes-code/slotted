import { Component, effect, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlMultiSelect, SlMultiSelectItem } from '@slotted/angular/multi-select';

interface Customer {
  value: string;
  label: string;
  city: string;
}

const CUSTOMERS: Customer[] = [
  { value: 'ALFKI', label: 'Alfreds Futterkiste', city: 'Berlin' },
  { value: 'ANATR', label: 'Ana Trujillo Emparedados', city: 'México D.F.' },
  { value: 'BERGS', label: 'Berglunds snabbköp', city: 'Luleå' },
  { value: 'BLAUS', label: 'Blauer See Delikatessen', city: 'Mannheim' },
  { value: 'BONAP', label: 'Bon app’', city: 'Marseille' },
  { value: 'BOTTM', label: 'Bottom-Dollar Markets', city: 'Tsawassen' },
  { value: 'ERNSH', label: 'Ernst Handel', city: 'Graz' },
  { value: 'FOLKO', label: 'Folk och fä HB', city: 'Bräcke' },
  { value: 'FRANK', label: 'Frankenversand', city: 'München' },
  { value: 'QUICK', label: 'QUICK-Stop', city: 'Cunewalde' },
  { value: 'RATTC', label: 'Rattlesnake Canyon Grocery', city: 'Albuquerque' },
  { value: 'SAVEA', label: 'Save-a-lot Markets', city: 'Boise' },
];

/** Stands in for the customer search endpoint, which filters on the server. */
const searchCustomers = (query: string) =>
  new Promise<Customer[]>((resolve) =>
    setTimeout(() => {
      const needle = query.trim().toLowerCase();
      resolve(CUSTOMERS.filter((customer) => customer.label.toLowerCase().includes(needle)));
    }, 600),
  );

/** The first page of customers, which arrives with the page itself. */
const FIRST_PAGE = CUSTOMERS.slice(0, 6);

@Component({
  selector: 'app-multi-select-async-search',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Customers in this campaign</label>
      <sl-multi-select
        placeholder="Search customers"
        [filter]="null"
        [loading]="loading()"
        [messages]="{ empty: 'No customer by that name.', loading: 'Searching customers…' }"
        (inputValueChange)="query.set($event)"
      >
        @for (customer of results(); track customer.value) {
          <sl-multi-select-item
            [value]="customer.value"
            [label]="customer.label"
            [description]="customer.city"
          />
        }
      </sl-multi-select>
      <span slFieldDescription>Each keystroke searches the customer list on the server.</span>
    </div>
  `,
})
export class MultiSelectAsyncSearch {
  protected readonly query = signal('');
  protected readonly results = signal<Customer[]>(FIRST_PAGE);
  protected readonly loading = signal(false);

  constructor() {
    effect((onCleanup) => {
      const query = this.query();
      if (query.trim() === '') {
        this.results.set(FIRST_PAGE);
        this.loading.set(false);
        return;
      }
      let current = true;
      this.loading.set(true);
      void searchCustomers(query).then((found) => {
        if (!current) return;
        this.results.set(found);
        this.loading.set(false);
      });
      onCleanup(() => {
        current = false;
      });
    });
  }
}
