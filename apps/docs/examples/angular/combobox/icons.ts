import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type { GlyphName } from '@slotted/angular/icon';

const DOCUMENTS: { id: string; name: string; glyph: GlyphName }[] = [
  { id: 'price-list', name: 'Q4 wholesale price list.xlsx', glyph: 'file-spreadsheet' },
  { id: 'carrier-contract', name: 'Carrier contract 2026.pdf', glyph: 'file-text' },
  { id: 'floor-plan', name: 'Reno floor plan.png', glyph: 'file-image' },
  { id: 'returns-deck', name: 'Returns policy review.key', glyph: 'presentation' },
  { id: 'product-photos', name: 'Autumn product photos.zip', glyph: 'file-archive' },
];

@Component({
  selector: 'app-combobox-icons',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Attach a document</label>
      <sl-combobox placeholder="Search shared files">
        @for (document of documents; track document.id) {
          <sl-combobox-item [value]="document.id" [label]="document.name" [icon]="document.glyph" />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxIcons {
  protected readonly documents = DOCUMENTS;
}
