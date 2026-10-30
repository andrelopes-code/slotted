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

@Component({
  selector: 'app-multi-select-narrow',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack],
  template: `
    <div slStack [gap]="4" style="inline-size: 7rem">
      <div slField>
        <label slFieldLabel>Channels</label>
        <sl-multi-select size="sm" width="content" [items]="channels" [value]="chosen">
          @for (channel of channels; track channel.value) {
            <sl-multi-select-item [value]="channel.value" [label]="channel.label" />
          }
        </sl-multi-select>
      </div>
    </div>
  `,
})
export class MultiSelectNarrow {
  protected readonly channels = CHANNELS;
  protected readonly chosen = ['web', 'marketplace', 'wholesale'];
}
