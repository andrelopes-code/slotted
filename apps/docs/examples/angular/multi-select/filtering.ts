import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlMultiSelect, SlMultiSelectItem } from '@slotted/angular/multi-select';

const CITIES = [
  { value: 'cdz', label: 'Cádiz, Spain' },
  { value: 'dus', label: 'Düsseldorf, Germany' },
  { value: 'krk', label: 'Kraków, Poland' },
  { value: 'mmx', label: 'Malmö, Sweden' },
  { value: 'yul', label: 'Montréal, Canada' },
  { value: 'gru', label: 'São Paulo, Brazil' },
  { value: 'zrh', label: 'Zürich, Switzerland' },
  { value: 'aar', label: 'Aarhus, Denmark' },
];

@Component({
  selector: 'app-multi-select-filtering',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Distributor cities</label>
      <sl-multi-select placeholder="Search cities">
        @for (city of cities; track city.value) {
          <sl-multi-select-item [value]="city.value" [label]="city.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>Type “zur” or “malmo”: accents and case are ignored.</span>
    </div>
  `,
})
export class MultiSelectFiltering {
  protected readonly cities = CITIES;
}
