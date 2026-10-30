import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type { GlyphName } from '@slotted/angular/icon';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';

const FORMATS: (SelectOption & { icon: GlyphName; description: string })[] = [
  {
    value: 'csv',
    label: 'CSV',
    icon: 'file-spreadsheet',
    description: 'Opens in Excel and Google Sheets.',
  },
  {
    value: 'pdf',
    label: 'PDF',
    icon: 'file-text',
    description: 'Paginated, with the company letterhead.',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: 'file',
    description: 'For an import into another system.',
  },
];

@Component({
  selector: 'app-select-descriptions',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Export format</label>
      <sl-select value="csv" [items]="formats">
        @for (format of formats; track format.value) {
          <sl-select-item
            [value]="format.value"
            [description]="format.description"
            [icon]="format.icon"
            >{{ format.label }}</sl-select-item
          >
        }
      </sl-select>
    </div>
  `,
})
export class SelectDescriptions {
  protected readonly formats = FORMATS;
}
