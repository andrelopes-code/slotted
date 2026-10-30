import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  provideSelectDefaults,
  SlSelect,
  SlSelectItem,
  type SelectOption,
} from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const OWNERS: SelectOption[] = [
  { value: 'avery', label: 'Avery Collins' },
  { value: 'kenji', label: 'Kenji Watanabe' },
  { value: 'lucia', label: 'Lucía Fernández' },
];

const SEGMENTS: SelectOption[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'retail', label: 'Retail' },
];

@Component({
  selector: 'app-select-defaults',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem, SlStack],
  providers: [provideSelectDefaults({ size: 'sm', variant: 'subtle', clearable: true })],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Account owner</label>
        <sl-select placeholder="Any owner" value="lucia" [items]="owners">
          @for (owner of owners; track owner.value) {
            <sl-select-item [value]="owner.value">{{ owner.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slField>
        <label slFieldLabel>Segment</label>
        <sl-select placeholder="Any segment" value="wholesale" [items]="segments">
          @for (segment of segments; track segment.value) {
            <sl-select-item [value]="segment.value">{{ segment.label }}</sl-select-item>
          }
        </sl-select>
      </div>
    </div>
  `,
})
export class SelectDefaults {
  protected readonly owners = OWNERS;
  protected readonly segments = SEGMENTS;
}
