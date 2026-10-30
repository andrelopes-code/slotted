import { Component, signal } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlSelect,
  SlSelectItem,
  type SelectOption,
  type SelectSelection,
} from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const STATUSES: SelectOption[] = [
  { value: 'open', label: 'Open' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'shipped', label: 'Shipped' },
];

const CHANNELS: SelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'phone', label: 'Phone orders' },
];

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

@Component({
  selector: 'app-select-narrow',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem, SlStack],
  template: `
    <div slStack [gap]="4" style="inline-size: 7rem">
      <div slField>
        <label slFieldLabel>Status</label>
        <sl-select size="sm" value="on-hold" [items]="statuses">
          @for (status of statuses; track status.value) {
            <sl-select-item [value]="status.value">{{ status.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slField>
        <label slFieldLabel>Channels</label>
        <sl-select size="sm" multiple [items]="channels" [(value)]="chosenChannels">
          @for (channel of channels; track channel.value) {
            <sl-select-item [value]="channel.value">{{ channel.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slField>
        <label slFieldLabel>Warehouse</label>
        <sl-select size="sm" width="content" value="CMH" [items]="warehouses">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
          }
        </sl-select>
      </div>
    </div>
  `,
})
export class SelectNarrow {
  protected readonly statuses = STATUSES;
  protected readonly channels = CHANNELS;
  protected readonly warehouses = WAREHOUSES;
  protected readonly chosenChannels = signal<SelectSelection>(['web', 'marketplace', 'wholesale']);
}
