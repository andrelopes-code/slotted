import { Component, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const CARRIERS: MultiSelectOption[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
  { value: 'dhl', label: 'DHL Express' },
];

/** Stands in for a request to the shipping rates API. */
const fetchCarriers = () =>
  new Promise<MultiSelectOption[]>((resolve) => setTimeout(() => resolve(CARRIERS), 1500));

@Component({
  selector: 'app-multi-select-loading',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Carriers offered at checkout</label>
      <sl-multi-select
        placeholder="Add a carrier"
        [loading]="loading()"
        [items]="carriers()"
        [messages]="{ loading: 'Fetching carriers…' }"
        (openChange)="load($event)"
      >
        @for (carrier of carriers(); track carrier.value) {
          <sl-multi-select-item [value]="carrier.value" [label]="carrier.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>Carriers load from the rates service when the list opens.</span>
    </div>
  `,
})
export class MultiSelectLoading {
  protected readonly carriers = signal<MultiSelectOption[]>([]);
  protected readonly loading = signal(false);
  private loaded = false;

  protected async load(open: boolean): Promise<void> {
    if (!open || this.loaded || this.loading()) return;
    this.loading.set(true);
    this.carriers.set(await fetchCarriers());
    this.loading.set(false);
    this.loaded = true;
  }
}
