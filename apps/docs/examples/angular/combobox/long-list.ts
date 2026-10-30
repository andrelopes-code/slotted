import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const BINS = Array.from({ length: 240 }, (_, index) => {
  const aisle = String(Math.floor(index / 20) + 1).padStart(2, '0');
  const bay = String((index % 20) + 1).padStart(2, '0');
  return { id: `A${aisle}-B${bay}`, detail: `Aisle ${Number(aisle)}, bay ${Number(bay)} · Reno` };
});

@Component({
  selector: 'app-combobox-long-list',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Put-away bin</label>
      <sl-combobox placeholder="Search 240 bins">
        @for (bin of bins; track bin.id) {
          <sl-combobox-item [value]="bin.id" [label]="bin.id" [description]="bin.detail" />
        }
      </sl-combobox>
      <span slFieldDescription>Page Down and Page Up move ten bins at a time.</span>
    </div>
  `,
})
export class ComboboxLongList {
  protected readonly bins = BINS;
}
