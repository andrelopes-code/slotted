import { Component, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';

const SLOTS: SelectOption[] = [
  { value: 'thu-am', label: 'Thursday, 8:00–12:00' },
  { value: 'thu-pm', label: 'Thursday, 13:00–17:00' },
  { value: 'fri-am', label: 'Friday, 8:00–12:00' },
];

/** Stands in for a request to the carrier's pickup API. */
const fetchSlots = () =>
  new Promise<SelectOption[]>((resolve) => setTimeout(() => resolve(SLOTS), 1500));

@Component({
  selector: 'app-select-loading',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Pickup slot</label>
      <sl-select
        placeholder="Choose a slot"
        [loading]="loading()"
        [items]="slots()"
        [messages]="{ loading: 'Fetching pickup slots…' }"
        (openChange)="load($event)"
      >
        @for (slot of slots(); track slot.value) {
          <sl-select-item [value]="slot.value">{{ slot.label }}</sl-select-item>
        }
      </sl-select>
      <span slFieldDescription>Slots load from the carrier when the list opens.</span>
    </div>
  `,
})
export class SelectLoading {
  protected readonly slots = signal<SelectOption[]>([]);
  protected readonly loading = signal(false);
  private loaded = false;

  protected async load(open: boolean): Promise<void> {
    if (!open || this.loaded || this.loading()) return;
    this.loading.set(true);
    this.slots.set(await fetchSlots());
    this.loading.set(false);
    this.loaded = true;
  }
}
