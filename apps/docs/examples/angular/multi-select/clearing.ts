import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
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
  selector: 'app-multi-select-clearing',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Show orders from</label>
        <sl-multi-select placeholder="All channels" [items]="channels" [value]="shown">
          @for (channel of channels; track channel.value) {
            <sl-multi-select-item [value]="channel.value" [label]="channel.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>The clear button empties the filter in one press.</span>
      </div>
      <div slField>
        <label slFieldLabel>Sell through</label>
        <sl-multi-select [clearable]="false" [items]="channels" [value]="selling">
          @for (channel of channels; track channel.value) {
            <sl-multi-select-item [value]="channel.value" [label]="channel.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>No clear button: channels come off one at a time.</span>
      </div>
    </div>
  `,
})
export class MultiSelectClearing {
  protected readonly channels = CHANNELS;
  protected readonly shown = ['web', 'marketplace', 'phone'];
  protected readonly selling = ['web', 'wholesale'];
}
