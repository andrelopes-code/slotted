import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type { GlyphName } from '@slotted/angular/icon';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const DOCUMENTS: (MultiSelectOption & { icon: GlyphName; description: string })[] = [
  {
    value: 'invoice',
    label: 'Invoice',
    icon: 'file-text',
    description: 'PDF, issued when the order ships',
  },
  {
    value: 'packing-slip',
    label: 'Packing slip',
    icon: 'file',
    description: 'PDF, one page per parcel',
  },
  {
    value: 'customs',
    label: 'Customs declaration',
    icon: 'file-spreadsheet',
    description: 'CN23, international orders only',
  },
  {
    value: 'photos',
    label: 'Product photos',
    icon: 'file-image',
    description: 'Up to five images per line item',
  },
];

@Component({
  selector: 'app-multi-select-descriptions',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Attach to the shipping email</label>
      <sl-multi-select placeholder="Add a document" [items]="documents" [value]="attached">
        @for (document of documents; track document.value) {
          <sl-multi-select-item
            [value]="document.value"
            [label]="document.label"
            [description]="document.description"
            [icon]="document.icon"
          />
        }
      </sl-multi-select>
    </div>
  `,
})
export class MultiSelectDescriptions {
  protected readonly documents = DOCUMENTS;
  protected readonly attached = ['invoice'];
}
