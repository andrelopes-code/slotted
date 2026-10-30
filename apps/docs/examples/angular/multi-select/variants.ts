import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';

const CHANNELS: MultiSelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'phone', label: 'Phone orders' },
];

const VARIANTS = [
  { variant: 'outline', label: 'Sales channels' },
  { variant: 'subtle', label: 'Promotion channels' },
  { variant: 'plain', label: 'Report channels' },
] as const;

@Component({
  selector: 'app-multi-select-variants',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (entry of variants; track entry.variant) {
        <div slField>
          <label slFieldLabel>{{ entry.label }}</label>
          <sl-multi-select [variant]="entry.variant" [items]="channels" [value]="chosen">
            @for (channel of channels; track channel.value) {
              <sl-multi-select-item [value]="channel.value" [label]="channel.label" />
            }
          </sl-multi-select>
        </div>
      }
    </div>
  `,
})
export class MultiSelectVariants {
  protected readonly variants = VARIANTS;
  protected readonly channels = CHANNELS;
  protected readonly chosen = ['web', 'wholesale'];
}
