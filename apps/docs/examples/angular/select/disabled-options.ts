import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';

const CARRIERS: { value: string; label: string; disabled?: boolean; description?: string }[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  {
    value: 'dhl',
    label: 'DHL Express',
    disabled: true,
    description: 'Account on hold until invoice INV-21462 is paid.',
  },
  { value: 'usps', label: 'USPS Priority Mail' },
];

@Component({
  selector: 'app-select-disabled-options',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Carrier</label>
      <sl-select placeholder="Choose a carrier">
        @for (carrier of carriers; track carrier.value) {
          <sl-select-item
            [value]="carrier.value"
            [disabled]="carrier.disabled ?? false"
            [description]="carrier.description"
            >{{ carrier.label }}</sl-select-item
          >
        }
      </sl-select>
    </div>
  `,
})
export class SelectDisabledOptions {
  protected readonly carriers = CARRIERS;
}
