import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import type { ComboboxOpenOn } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

const MODES: { openOn: ComboboxOpenOn; label: string; hint: string }[] = [
  { openOn: 'input', label: 'Opens on typing', hint: 'Typing or a press on the field opens it.' },
  { openOn: 'focus', label: 'Opens on focus', hint: 'Every focus opens it, Tab included.' },
  {
    openOn: 'manual',
    label: 'Opens on request',
    hint: 'Only the button and the arrow keys open it.',
  },
];

const CHANNELS = ['Online store', 'Wholesale portal', 'Marketplace', 'Retail partners'];

@Component({
  selector: 'app-combobox-open-on',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (mode of modes; track mode.openOn) {
        <div slField>
          <label slFieldLabel>{{ mode.label }}</label>
          <sl-combobox placeholder="Sales channel" [openOn]="mode.openOn">
            @for (channel of channels; track channel) {
              <sl-combobox-item [value]="channel" [label]="channel" />
            }
          </sl-combobox>
          <span slFieldDescription>{{ mode.hint }}</span>
        </div>
      }
    </div>
  `,
})
export class ComboboxOpening {
  protected readonly modes = MODES;
  protected readonly channels = CHANNELS;
}
